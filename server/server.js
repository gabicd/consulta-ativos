import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path'
import YahooFinance from "yahoo-finance2";
import 'dotenv/config'

const app = express();  
app.use(express.json());
app.use(cors());
const dataFilePath = path.join(process.cwd(), 'persistentData.json');
const yahooFinance = new YahooFinance(); //api externa de cotação

const PORT = 3000

const isWeekend = date => date.getUTCDay() % 6 === 0;

app.post('/submit', async (req, res) => {
    const { assetArray, startDate, endDate } = req.body;
    const ativos = assetArray.flat();
    const newData = []
    const jsonData = await loadData(dataFilePath)
    
    try {   
        const searchDates = getIntervalDates(startDate, endDate)
        const promises = ativos.map(async ativo => {
            const responseData = []
            const {foundDates, missingDates} =  findMissingDates(jsonData, searchDates, ativo)
            const currentEntry = jsonData[ativo] || {nome: null, data: []}
            let nomeCompleto = currentEntry.nome
            
            const newStart = new Date (missingDates[0])
            const newEnd = new Date(missingDates[missingDates.length - 1])
            newEnd.setUTCDate(newEnd.getUTCDate() + 1)    
           
            searchCachedData(jsonData, foundDates, ativo, responseData)
            
            if (missingDates.length > 0){            
                const symbol = `${ativo}.SA`   
                const response = await yahooFinance.chart(symbol, {
                    period1: newStart,
                    period2: newEnd
                })
                const cotacoes = response.quotes
                nomeCompleto = response.meta.longName
                
                const filteredData = cotacoes.map((cotacao) => ({
                date: cotacao.date.toISOString().split('T')[0], 
                closeValue: cotacao.close, 
            }));

            
            responseData.push(...filteredData)
            newData.push({asset: ativo, data: filteredData, nome: nomeCompleto})
            
            responseData.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        return {
            asset: ativo, 
            data: responseData,
            nome: nomeCompleto
        }
    });
        const results = await Promise.all(promises);   
        
        if (newData && newData.length > 0){
                   
            newData.forEach(result => {
            const { asset, data, nome } = result;
            if (data && data.length > 0) {
                const cachedData = jsonData[asset] || { nome: nome, data: [] };
                cachedData.nome = nome;
                const mergedData = cachedData.data.concat(data)
                cachedData.data = mergedData
                jsonData[asset] = cachedData
            } 
        });
            await fs.writeFile(dataFilePath, JSON.stringify(jsonData, null, 2));
        }

        res.json({ data: results });
        
    } catch (error) {
        console.error('Error fetching data from external API:', error);
        res.status(500).json({ error: 'Failed to fetch data from external API' });
    }
});  

function getIntervalDates(startDate, endDate) {
    const days = []
    let currentDate = new Date(`${startDate}T00:00:00Z`);
    const finalDate = new Date(`${endDate}T00:00:00Z`);

    while (currentDate <= finalDate) {
        if (!(isWeekend(currentDate))) {
            days.push(currentDate.toISOString().split('T')[0]);
        }
        
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
    
    return days;
}

function findMissingDates(jsonData, searchDates, ativo) {
    const foundDates = []
    const missingDates = []
    
    if(jsonData[ativo] && jsonData[ativo].data){        
        const assetData = jsonData[ativo].data
        const existingDates = new Set(assetData.map(record => record.date))

        for (const date of searchDates) {
            if (existingDates.has(date)) {
                foundDates.push(date)
            } else {
                missingDates.push(date)
            }
        }
        
    } else {
        missingDates.push(...searchDates)
    }
    
    return {
        foundDates,
        missingDates
    }
}

function searchCachedData(jsonData, foundDates, ativo, responseData){
    if(jsonData[ativo] && jsonData[ativo].data){        
        const assetData = jsonData[ativo].data
        for (const date of foundDates) {
            const matchingObject = assetData.find(record => record.date === date);
            if (matchingObject) {
                responseData.push(matchingObject)
            } 
        }}
   
}

async function loadData(dataPath){
    let jsonData = {}
    try {
        const fileContent = await fs.readFile(dataPath, 'utf8')
        if(fileContent === '') {
            
            jsonData = {}
        } else {
            jsonData = JSON.parse(fileContent)
        }
        
    } catch (error) {
        if(error.code === 'ENOENT') {
            console.log('File doesnt exist, creating now')
            jsonData = {}
        } else {
            console.log(error)
            process.exit(1);
        }
    } 
        
    return jsonData
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})