import express from 'express';
import axios from 'axios';
import cors from 'cors';
import 'dotenv/config'

const app = express();  
app.use(express.json());
app.use(cors());

const PORT = 3000
const API_KEY =  process.env.MY_API_KEY
const BASE_URL = "https://www.alphavantage.co/query?function="

app.post('/submit', async (req, res) => {
    const { assetArray } = req.body;
    const ativos = assetArray.flat();
    console.log('Received body:', ativos);
    
    const data = []

    try {   // operação não otimizada, teste de chamada para API externa com múltiplos ativos
            for (let ativo of ativos){        
            const result = await axios.get(`${BASE_URL}TIME_SERIES_DAILY&symbol=${ativo}.SA&apikey=${API_KEY}`);
            console.log('External API response data:', result.data);
            data.push({ativo: ativo, info: result.data})        
    }
        res.json(data);
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({ error: 'Failed to fetch data from external API' });
    }
    });  


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})