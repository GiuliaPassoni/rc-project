import express from 'express';
import { cellsRouter } from './routes/cells';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.use('/cells', cellsRouter);

//  Error-handling middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  },
);

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

export { app };
