require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pool = require("./database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

const jwtSecret = process.env.JWT_SECRET || "secreto_del_token";

// Ruta de prueba de servidor
app.get("/", (req, res) => {
    res.send("¡Servidor Express OK!");
});

// Ruta para registrar un nuevo usuario
app.post("/register", async (req, res) => {
    console.log("Body recibido:", req.body);
    const { nombre_completo, email, numberphone, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            `INSERT INTO user_mobile (nombre_completo, email, numberphone, password)
        VALUES ($1, $2, $3, $4)`,
            [nombre_completo, email, numberphone, hashedPassword]
        );
        res.status(201).json({ message: "Usuario registrado con éxito" });
    } catch (err) {
        console.error("Error en /register:", err);
        res.status(400).json({ message: "Error en registro", error: err.message });
    }
});

// Ruta para iniciar sesión
app.post("/login", async (req, res) => {
    console.log("Body recibido:", req.body);
    const { email, password } = req.body;
    try {
        const result = await pool.query(
            "SELECT * FROM user_mobile WHERE email = $1",
            [email]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ message: "Usuario no encontrado" });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Contraseña incorrecta" });
        }

        const token = jwt.sign({ id: user.id, email: user.email }, jwtSecret, {
            expiresIn: "1h",
        });

        res.json({
            token,
            user: {
                id: user.id,
                nombre_completo: user.nombre_completo,
                email: user.email,
            },
        });
    } catch (err) {
        console.error("Error en /login:", err);
        res.status(500).json({ message: "Error del servidor", error: err.message });
    }
});

// middleware de autenticación
const authenticate = (req, res, next) => {
    const header = req.headers.authorization?.split(" ")[1];
    if (!header) return res.status(401).json({ message: "No autorizado" });
    try {
        const payload = jwt.verify(header, jwtSecret);
        req.user = payload; // contiene id y email
        next();
    } catch {
        res.status(401).json({ message: "Token inválido" });
    }
};

// GET /routes  – todas las rutas del usuario
app.get("/routes", authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            "SELECT * FROM user_routes WHERE user_id = $1 ORDER BY created_at DESC",
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error("/routes GET:", err);
        res.status(500).json({ message: "Error al obtener rutas" });
    }
});

// POST /routes – crea una ruta nueva
app.post("/routes", authenticate, async (req, res) => {
    const {
        name,
        distance_km,
        duration_minutes,
        difficulty,
        elevation_meters,
        type,
        rating,
        completed,
        color,
        coordinates,
        start_location,
    } = req.body;

    try {
        const { rows } = await pool.query(
            `INSERT INTO user_routes
        (user_id, name, distance_km, duration_minutes, difficulty,
         elevation_meters, type, rating, completed, color,
         coordinates, start_location)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
            [
                req.user.id,
                name,
                distance_km,
                duration_minutes,
                difficulty,
                elevation_meters,
                type,
                rating || 0,
                completed || false,
                color,
                coordinates,
                start_location || null,
            ]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error("/routes POST:", err);
        res.status(400).json({ message: "Error al guardar ruta", error: err.message });
    }
});

// DELETE /routes/:id – elimina la ruta
app.delete("/routes/:id", authenticate, async (req, res) => {
    try {
        await pool.query(
            "DELETE FROM user_routes WHERE id = $1 AND user_id = $2",
            [req.params.id, req.user.id]
        );
        res.json({ message: "Ruta eliminada" });
    } catch (err) {
        console.error("/routes DELETE:", err);
        res.status(500).json({ message: "Error al eliminar ruta" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// INCIDENTS ROUTES
// ──────────────────────────────────────────────────────────────────────────────

// GET /incidents – lista todos los incidentes del usuario autenticado
app.get("/incidents", authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT 
         id,
         category,
         description,
         photo_url,
         latitude,
         longitude,
         address,
         reports,
         status,
         created_at,
         updated_at
       FROM incidents
       WHERE user_id = $1
       ORDER BY created_at DESC`,
            [req.user.id]
        );
        res.json(rows);
    } catch (err) {
        console.error("/incidents GET:", err);
        res.status(500).json({ message: "Error al obtener incidentes" });
    }
});

// POST /incidents – crea un nuevo incidente
app.post("/incidents", authenticate, async (req, res) => {
    const {
        category,
        description,
        photo_url,
        location: { latitude, longitude, address },
    } = req.body;

    if (!category || !description || latitude == null || longitude == null || !address) {
        return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    try {
        const { rows } = await pool.query(
            `INSERT INTO incidents
        (user_id, category, description, photo_url, latitude, longitude, address)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7)
        RETURNING 
        id,
        category,
        description,
        photo_url,
        latitude,
        longitude,
        address,
        reports,
        status,
        created_at,
        updated_at`,
            [
                req.user.id,
                category,
                description,
                photo_url || null,
                latitude,
                longitude,
                address,
            ]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error("/incidents POST:", err);
        res.status(400).json({ message: "Error al guardar incidente", error: err.message });
    }
});

// PATCH /incidents/:id/report – incrementa contador de reports
app.patch("/incidents/:id/report", authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `UPDATE incidents
        SET reports = reports + 1,
            updated_at = NOW()
        WHERE id = $1 AND user_id = $2
       RETURNING *`,
            [req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ message: "Incidente no encontrado" });
        res.json(rows[0]);
    } catch (err) {
        console.error("/incidents/:id/report PATCH:", err);
        res.status(500).json({ message: "No se pudo confirmar el incidente" });
    }
});

// PATCH /incidents/:id/status – actualiza el estado (e.g. 'Atendido')
app.patch("/incidents/:id/status", authenticate, async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Falta el campo status" });

    try {
        const { rows } = await pool.query(
            `UPDATE incidents
        SET status = $1,
            updated_at = NOW()
        WHERE id = $2 AND user_id = $3
       RETURNING *`,
            [status, req.params.id, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ message: "Incidente no encontrado" });
        res.json(rows[0]);
    } catch (err) {
        console.error("/incidents/:id/status PATCH:", err);
        res.status(500).json({ message: "No se pudo actualizar estado" });
    }
});

// DELETE /incidents/:id – elimina un incidente
app.delete("/incidents/:id", authenticate, async (req, res) => {
    try {
        await pool.query(
            `DELETE FROM incidents
        WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.user.id]
        );
        res.json({ message: "Incidente eliminado" });
    } catch (err) {
        console.error("/incidents/:id DELETE:", err);
        res.status(500).json({ message: "No se pudo eliminar incidente" });
    }
});

// ──────────────────────────────────────────────────────────────────────────────
// PROFILE USER
// ──────────────────────────────────────────────────────────────────────────────

// 1) Obtener perfil
app.get("/profile", authenticate, async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT 
         u.id,
         u.nombre_completo AS name,
         u.email,
         p.avatar_url,
         p.bio,
         p.city,
         to_char(p.join_date, 'Mon YYYY') AS joinDate,
         p.level,
         p.achievements,
         p.notifications,
         p.dark_mode    AS darkMode,
         p.private_profile AS privateProfile
       FROM user_mobile u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.id = $1`,
            [req.user.id]
        );
        if (!rows.length) return res.status(404).json({ message: "Perfil no encontrado" });
        res.json(rows[0]);
    } catch (err) {
        console.error("/profile GET:", err);
        res.status(500).json({ message: "Error al obtener perfil" });
    }
});

// 2) Crear o actualizar perfil
app.post("/profile", authenticate, async (req, res) => {
    const {
        avatar_url,
        bio,
        city,
        level,
        achievements,
        notifications,
        darkMode,
        privateProfile
    } = req.body;

    try {
        // Upsert: si existe, actualiza; si no, inserta
        const { rows } = await pool.query(
            `INSERT INTO user_profiles
         (user_id, avatar_url, bio, city, level, achievements, notifications, dark_mode, private_profile)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (user_id) DO UPDATE
         SET avatar_url     = EXCLUDED.avatar_url,
             bio            = EXCLUDED.bio,
             city           = EXCLUDED.city,
             level          = EXCLUDED.level,
             achievements   = EXCLUDED.achievements,
             notifications  = EXCLUDED.notifications,
             dark_mode      = EXCLUDED.dark_mode,
             private_profile= EXCLUDED.private_profile,
             updated_at     = NOW()
       RETURNING *`,
            [
                req.user.id,
                avatar_url || null,
                bio || '',
                city || '',
                level || 'Principiante',
                achievements != null ? achievements : 0,
                notifications != null ? notifications : true,
                darkMode != null ? darkMode : false,
                privateProfile != null ? privateProfile : false
            ]
        );
        res.json(rows[0]);
    } catch (err) {
        console.error("/profile POST:", err);
        res.status(400).json({ message: "Error al guardar perfil", error: err.message });
    }
});

// 3) Toggle rápido de una sola configuración (ejemplo: notificaciones)
app.patch("/profile/settings", authenticate, async (req, res) => {
    const { field, value } = req.body;
    const allowed = ["notifications", "dark_mode", "private_profile"];
    if (!allowed.includes(field)) {
        return res.status(400).json({ message: "Campo no permitdo" });
    }

    try {
        const { rows } = await pool.query(
            `UPDATE user_profiles
         SET ${field} = $1,
             updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
            [value, req.user.id]
        );
        if (!rows.length) return res.status(404).json({ message: "Perfil no encontrado" });
        res.json(rows[0]);
    } catch (err) {
        console.error("/profile/settings PATCH:", err);
        res.status(500).json({ message: "No se pudo actualizar configuración" });
    }
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
