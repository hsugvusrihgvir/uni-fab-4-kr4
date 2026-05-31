const express = require("express");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { createClient } = require("redis");

const app = express();
const port = 3000;

const JWT_SECRET = "alnz4Rwm6NSW";
const ACCESS_EXPIRES_IN = "15m";
const REFRESH_SECRET = "refresh_secret_123";
const REFRESH_EXPIRES_IN = "7d";

// время хранения данных в redis.
const USERS_CACHE_TTL = 60;
const PRODUCTS_CACHE_TTL = 600;

app.use(cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
}));

app.use(express.json());

let products = [
    {
        id: nanoid(6),
        title: "Товар 1",
        category: "Категория 1",
        description: "Описание",
        price: 2490,
        stock: 15,
        rating: 4.5,
        image: "https://avatars.mds.yandex.net/i?id=6cefae59a2b2d652cedc541df52559d07b8d7776-8878159-images-thumbs&n=13"
    },
    {
        id: nanoid(6),
        title: "Товар 2",
        category: "Категория 1",
        description: "Описание",
        price: 4590,
        stock: 8,
        rating: 4.7,
        image: "https://i.pinimg.com/736x/e6/56/4b/e6564bb16e340c8ad4b4c66aeefb377b.jpg"
    },
    {
        id: nanoid(6),
        title: "Товар 3",
        category: "Категория 2",
        description: "Описание",
        price: 21990,
        stock: 5,
        rating: 4.8,
        image: "https://i.pinimg.com/originals/e2/46/04/e246049d83c799b78a0ef20345f3d34c.gif"
    }
];

let users = [
    {
        id: nanoid(6),
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        role: "admin",
        is_blocked: false,
        hashedPassword: "$2b$10$wQOQH0J8v7G4apx0wq4AjueQJ8xUu8pR8vA2L4Hbo2C0u4B8kL4Ze"
    }
];

const refreshTokens = new Set();

// Доработка практики 21: подключение Redis для кэширования GET-запросов.
const redisClient = createClient({
    url: "redis://127.0.0.1:6379"
});

redisClient.on("error", (err) => {
    console.error("Redis error:", err);
});

function findProductOr404(id, res) {
    const product = products.find((p) => p.id === id);

    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }

    return product;
}

function findUserByEmailOr404(email, res) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find((u) => u.email.toLowerCase() === normalizedEmail);

    if (!user) {
        res.status(404).json({ error: "user not found" });
        return null;
    }

    return user;
}

async function hashPassword(password) {
    const rounds = 10;
    return bcrypt.hash(password, rounds);
}

function validateProductPayload(body) {
    const { title, category, description, price } = body;

    if (!title || !category || !description || price === undefined) {
        return "title, category, description and price are required";
    }

    const normalizedTitle = String(title).trim();
    const normalizedCategory = String(category).trim();
    const normalizedDescription = String(description).trim();
    const normalizedPrice = Number(price);

    if (!normalizedTitle || !normalizedCategory || !normalizedDescription) {
        return "title, category and description must not be empty";
    }

    if (Number.isNaN(normalizedPrice) || normalizedPrice < 0) {
        return "price must be a non-negative number";
    }

    if (body.stock !== undefined) {
        const stock = Number(body.stock);
        if (Number.isNaN(stock) || stock < 0) {
            return "stock must be a non-negative number";
        }
    }

    if (body.rating !== undefined) {
        const rating = Number(body.rating);
        if (Number.isNaN(rating) || rating < 0 || rating > 5) {
            return "rating must be a number from 0 to 5";
        }
    }

    return null;
}

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        JWT_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role,
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

app.use((req, res, next) => {
    res.on("finish", () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);

        if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
            console.log("Body:", req.body);
        }
    });

    next();
});

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header",
        });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Forbidden",
            });
        }

        next();
    };
}

// сначала ищет готовый ответ в redis
function cacheMiddleware(keyBuilder, ttl) {
    return async (req, res, next) => {
        try {
            const key = keyBuilder(req);
            const cachedData = await redisClient.get(key);

            if (cachedData) {
                return res.json({
                    source: "cache",
            data: JSON.parse(cachedData)
                });
            }

            // если кэша нет передаем ключ и TTL в обработчик маршрута
            req.cacheKey = key;
            req.cacheTTL = ttl;
            next();
        } catch (err) {
            console.error("Cache read error:", err);
            next();
        }
    };
}

// сохраняем ответ маршрута на ttl секунд.
async function saveToCache(key, data, ttl) {
    try {
        await redisClient.set(key, JSON.stringify(data), {
            EX: ttl
        });
    } catch (err) {
        console.error("Cache save error:", err);
    }
}

// сбрасываем кэш пользователей после изменения данных
async function invalidateUsersCache(userId = null) {
    try {
        await redisClient.del("users:all");
        if (userId) {
            await redisClient.del(`users:${userId}`);
        }
    } catch (err) {
        console.error("Users cache invalidate error:", err);
    }
}

// сбрасываем кэш товаров после создания, обновления или удаления
async function invalidateProductsCache(productId = null) {
    try {
        await redisClient.del("products:all");
        if (productId) {
            await redisClient.del(`products:${productId}`);
        }
    } catch (err) {
        console.error("Products cache invalidate error:", err);
    }
}

app.post("/api/auth/register", async (req, res) => {
    try {
        const { email, first_name, last_name, password, role } = req.body;

        if (!email || !first_name || !last_name || !password) {
            return res.status(400).json({ error: "email, first_name, last_name and password are required" });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const normalizedFirstName = String(first_name).trim();
        const normalizedLastName = String(last_name).trim();
        const normalizedPassword = String(password);

        if (!normalizedEmail || !normalizedFirstName || !normalizedLastName || !normalizedPassword) {
            return res.status(400).json({ error: "fields must not be empty" });
        }

        const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
        if (existingUser) {
            return res.status(400).json({ error: "user with this email already exists" });
        }

        const newUser = {
            id: nanoid(6),
            email: normalizedEmail,
            first_name: normalizedFirstName,
            last_name: normalizedLastName,
            role: role && ["user", "seller", "admin"].includes(role) ? role : "user",
            is_blocked: false,
            hashedPassword: await hashPassword(normalizedPassword)
        };

        users.push(newUser);
        await invalidateUsersCache();

        res.status(201).json({
            id: newUser.id,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role,
            is_blocked: newUser.is_blocked
        });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
    }

    const user = users.find(u => u.email === email);
    if (!user || user.is_blocked) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    res.json({
        accessToken,
        refreshToken,
    });
});

app.post("/api/auth/refresh", (req, res) => {
    const refreshToken = req.headers["x-refresh-token"];

    if (!refreshToken) {
        return res.status(400).json({
            error: "refreshToken is required",
        });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({
            error: "Invalid refresh token",
        });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = users.find((u) => u.id === payload.sub);

        if (!user || user.is_blocked) {
            return res.status(401).json({
                error: "User not found",
            });
        }

        refreshTokens.delete(refreshToken);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired refresh token",
        });
    }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.user.sub);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_blocked: user.is_blocked
    });
});

app.get(
    "/api/users",
    authMiddleware,
    roleMiddleware(["admin"]),
    // список пользователей кэшируется на 1 минуту
    cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
    async (req, res) => {
        const data = users.map((u) => ({
            id: u.id,
            email: u.email,
            first_name: u.first_name,
            last_name: u.last_name,
            role: u.role,
            is_blocked: u.is_blocked
        }));

        await saveToCache(req.cacheKey, data, req.cacheTTL);
        res.json({
            source: "server",
            data
        });
    }
);

app.get(
    "/api/users/:id",
    authMiddleware,
    roleMiddleware(["admin"]),
    // пользователь кэшируется на 1 минуту
    cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
    async (req, res) => {
        const user = users.find((u) => u.id === req.params.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const data = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            is_blocked: user.is_blocked
        };

        await saveToCache(req.cacheKey, data, req.cacheTTL);
        res.json({
            source: "server",
            data
        });
    }
);

app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const { first_name, last_name, role } = req.body;

    if (first_name !== undefined) {
        user.first_name = String(first_name).trim();
    }

    if (last_name !== undefined) {
        user.last_name = String(last_name).trim();
    }

    if (role !== undefined) {
        if (!["user", "seller", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        user.role = role;
    }

    await invalidateUsersCache(user.id);

    res.json({
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_blocked: user.is_blocked
    });
});

app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    user.is_blocked = true;
    await invalidateUsersCache(user.id);

    res.json({
        message: "User blocked",
        id: user.id
    });
});

app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
    const validationError = validateProductPayload(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const { title, category, description, price, stock, rating, image } = req.body;

    const newProduct = {
        id: nanoid(6),
        title: String(title).trim(),
        category: String(category).trim(),
        description: String(description).trim(),
        price: Number(price),
        stock: stock !== undefined ? Number(stock) : 0,
        rating: rating !== undefined ? Number(rating) : 0,
        image: image ? String(image).trim() : ""
    };

    products.push(newProduct);
    await invalidateProductsCache();
    res.status(201).json(newProduct);
});

app.get(
    "/api/products",
    authMiddleware,
    roleMiddleware(["user", "seller", "admin"]),
    // список товаров кэшируется на 10 минут
    cacheMiddleware(() => "products:all", PRODUCTS_CACHE_TTL),
    async (req, res) => {
        await saveToCache(req.cacheKey, products, req.cacheTTL);
        res.json({
            source: "server",
            data: products
        });
    }
);

app.get(
    "/api/products/:id",
    authMiddleware,
    roleMiddleware(["user", "seller", "admin"]),
    // конкретный товар кэшируется на 10 минут
    cacheMiddleware((req) => `products:${req.params.id}`, PRODUCTS_CACHE_TTL),
    async (req, res) => {
        const product = findProductOr404(req.params.id, res);
        if (!product) return;

        await saveToCache(req.cacheKey, product, req.cacheTTL);
        res.json({
            source: "server",
            data: product
        });
    }
);

app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;

    const validationError = validateProductPayload(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const { title, category, description, price, stock, rating, image } = req.body;

    product.title = String(title).trim();
    product.category = String(category).trim();
    product.description = String(description).trim();
    product.price = Number(price);
    product.stock = stock !== undefined ? Number(stock) : 0;
    product.rating = rating !== undefined ? Number(rating) : 0;
    product.image = image ? String(image).trim() : "";

    await invalidateProductsCache(product.id);
    res.json(product);
});

app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const id = req.params.id;
    const exists = products.some((p) => p.id === id);

    if (!exists) {
        return res.status(404).json({ error: "Product not found" });
    }

    products = products.filter((p) => p.id !== id);
    await invalidateProductsCache(id);
    res.status(204).send();
});

app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

async function start() {
    // перед запуском подключаемся к redis.
    await redisClient.connect();
    console.log("Redis connected");

    app.listen(port, () => {
        console.log(`Сервер запущен на http://localhost:${port}`);
    });
}

start().catch((err) => {
    console.error(err);
    process.exit(1);
});
