import express from "express";
import cors from "cors";
import authRouter from "./routes/auth/auth.route";
import productRouter from "./routes/product/product.route";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/products", productRouter);

app.get("/", (req, res) => {
    res.send("Hello Express + TypeScript!");
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
