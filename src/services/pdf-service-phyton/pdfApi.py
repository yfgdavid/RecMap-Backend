# pdf_api.py (O Serviço Python)
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware # IMPORTANTE: Nova importação
from pydantic import BaseModel
from typing import List
import io

# Importa a função de geração de PDF que criamos
from generate_pdf import generate_infografico_pdf, InfograficoData  

app = FastAPI()

origins = [
    "http://localhost:5173",  # Exemplo: Porta padrão do Vite/React. Ajuste para a porta do seu frontend!
    "http://127.0.0.1:5173",
    # Adicione aqui o endereço de produção do seu frontend quando for para o ar
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
 )

# Define como os dados devem ser recebidos do TypeScript
class DenunciaStatus(BaseModel):
    status: str
    count: int

class InfograficoRequest(BaseModel):
    totalDenuncias: int
    denunciasPendentes: int
    denunciasValidadas: int
    totalPontosColeta: int
    denunciasPorStatus: List[DenunciaStatus]

@app.post("/generate-pdf")
async def generate_pdf_endpoint(data: InfograficoRequest):
    # Converte os dados recebidos para o formato que a função de PDF entende
    infografico_data = InfograficoData(
        totalDenuncias=data.totalDenuncias,
        denunciasPendentes=data.denunciasPendentes,
        denunciasValidadas=data.denunciasValidadas,
        totalPontosColeta=data.totalPontosColeta,
        # O .model_dump() transforma os objetos em dicionários Python
        denunciasPorStatus=[d.model_dump() for d in data.denunciasPorStatus]
    )
    
    # Chama a função que gera o PDF (o coração da sua migração)
    pdf_bytes = generate_infografico_pdf(infografico_data)
    
    # Retorna o PDF como um arquivo para o TypeScript
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=relatorio_infografico.pdf"}
    )
