"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importStar(require("sqlite3"));
const path_1 = require("path");
const process_1 = require("process");
const user_1 = __importDefault(require("./models/user"));
const express_session_1 = __importDefault(require("express-session"));
const cors_1 = __importDefault(require("cors"));
const session_1 = __importDefault(require("./models/session"));
const express_1 = __importStar(require("express"));
const dbfile = (0, path_1.join)((0, path_1.resolve)('.'), process_1.env["dbFileName"] || 'sqlite.db');
console.log("DB File:", dbfile);
const sqlite = process_1.env.NODE_ENV == "development" ? (0, sqlite3_1.verbose)() : sqlite3_1.default;
const db = new sqlite.Database(dbfile);
const userModel = new user_1.default(db);
const Store = new session_1.default((typeof express_session_1.default["session"] !== "undefined") ? express_session_1.default["session"].Store : express_session_1.default.Store, { db });
const app = (0, express_1.default)();
const router = (0, express_1.Router)();
const PORT = process_1.env["PORT"] || 8080;
app.use((0, cors_1.default)());
// app.use(cookieParser() as RequestHandler)
app.use(express_1.default.json());
app.use((0, express_session_1.default)({
    store: Store,
    secret: process_1.env["SESSION_SECRET"] || 'secret',
    resave: true,
    saveUninitialized: true,
}));
router.get('/', (req, res, next) => {
    res.send("Hello, world!");
});
router.post('/account/login', (req, res) => {
    res.set({
        "Accept-Post": "application/json",
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    });
    const jsonBody = req.body;
    if (typeof jsonBody == "object" &&
        typeof jsonBody["username"] !== "undefined" &&
        typeof jsonBody["password"] !== "undefined") {
        userModel.authenticateUser(jsonBody.username, jsonBody.password).then(user => {
            res.status(200).json(user);
        }).catch(err => {
            res.status(401).end();
        });
    }
    else {
        res.status(400).end();
    }
});
app.use('/', router);
app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
});
userModel.createUser("plunged", "guest").then(() => userModel.getUser('plunged')).then((user) => {
    console.log(user);
}).catch((err) => {
    console.error(err);
});
