import express, { json } from 'express';
import { post } from 'axios';
import cors from 'cors';
const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(json());

// Enable CORS for all origins
app.use(cors());

app.post('/proxy', async (req, res) => {
  try {
    const response = await post(
      'https://www.myprotein.com/api/operation/ProductVariants/',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
