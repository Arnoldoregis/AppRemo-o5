import React, { useRef, useState } from 'react';
import { Removal } from '../../types';
import { X, Download, Loader, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import { CERTIFICATE_BACKGROUNDS } from '../../config/assets';

interface CertificateProps {
    removal: Removal;
    imageUrl: string;
}

// Helper para formatar data sem problemas de timezone (UTC vs Local)
const formatCremationDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data não definida';
    // Adiciona T00:00:00 para forçar a interpretação como data local, não UTC
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

const IndividualCertificate: React.FC<CertificateProps> = ({ removal, imageUrl }) => {
    const formattedDate = formatCremationDate(removal.cremationDate);

    return (
        <div
            className="relative w-[800px] h-[565px] text-black bg-white overflow-hidden"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
            {imageUrl && (
                <img 
                    src={imageUrl} 
                    alt="Certificado Individual" 
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                />
            )}
            <div className="absolute inset-0 z-10">
                <p className="absolute font-bold tracking-widest" style={{ top: '230px', left: '350px', fontSize: '24px' }}>
                    {removal.pet.name.toUpperCase()}
                </p>
                <p className="absolute font-bold tracking-wider" style={{ top: '265px', left: '350px', fontSize: '20px' }}>
                    {removal.pet.breed.toUpperCase()}
                </p>
                <p className="absolute font-bold tracking-wider" style={{ top: '265px', right: '100px', fontSize: '20px' }}>
                    {formattedDate}
                </p>
                <p className="absolute font-bold tracking-wider" style={{ top: '340px', left: '460px', fontSize: '20px' }}>
                    {removal.tutor.name.toUpperCase()}
                </p>
            </div>
        </div>
    );
};

const CollectiveCertificate: React.FC<CertificateProps> = ({ removal, imageUrl }) => {
    const formattedDate = formatCremationDate(removal.cremationDate);

    return (
        <div
            className="relative w-[800px] h-[565px] text-[#3a506b] bg-white overflow-hidden"
            style={{ fontFamily: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif" }}
        >
            {imageUrl && (
                <img 
                    src={imageUrl} 
                    alt="Certificado Coletivo" 
                    className="absolute inset-0 w-full h-full object-cover"
                    crossOrigin="anonymous"
                />
            )}
            <div className="absolute w-full text-center z-10" style={{ top: '230px', fontSize: '17px', lineHeight: '1.7' }}>
                <p>Certificamos que <span className="font-bold">{removal.pet.name}</span></p>
                <p>Da Raça <span className="font-bold">{removal.pet.breed}</span></p>
                <p>foi cremado em <span className="font-bold">{formattedDate}</span></p>
                <p>Em caráter Coletivo solicitado por</p>
                <p><span className="font-bold">{removal.tutor.name}</span></p>
            </div>
        </div>
    );
};

interface CertificateModalProps {
    isOpen: boolean;
    onClose: () => void;
    removal: Removal;
    onDownload?: () => void;
}

const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, removal, onDownload }) => {
    const certificateRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Usando as URLs centralizadas do arquivo de configuração
    const targetUrl = removal.modality === 'coletivo' 
        ? CERTIFICATE_BACKGROUNDS.collective 
        : CERTIFICATE_BACKGROUNDS.individual;

    const handleDownload = () => {
        if (certificateRef.current) {
            setIsGenerating(true);
            
            // Pequeno delay para garantir que a renderização está estável
            setTimeout(() => {
                html2canvas(certificateRef.current!, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true, // Permite carregar imagens externas (ImgBB)
                    allowTaint: false, // Impede canvas "sujo" para permitir download
                    logging: false,
                }).then(canvas => {
                    try {
                        const link = document.createElement('a');
                        link.download = `certificado_${removal.pet.name.replace(/\s+/g, '_')}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                        
                        if (onDownload) {
                            onDownload();
                        }
                    } catch (e) {
                        console.error("Erro ao salvar imagem (provavelmente Tainted Canvas):", e);
                        alert("Não foi possível baixar a imagem devido a restrições de segurança do navegador (CORS). Tente novamente ou use outro navegador.");
                    }
                    setIsGenerating(false);
                }).catch(err => {
                    console.error("Falha ao gerar o canvas do certificado:", err);
                    alert("Ocorreu um erro ao gerar o certificado. Tente novamente.");
                    setIsGenerating(false);
                });
            }, 100);
        }
    };

    const handlePrint = () => {
        if (certificateRef.current) {
            setIsGenerating(true);
            
            setTimeout(() => {
                html2canvas(certificateRef.current!, {
                    scale: 4, // Escala maior para melhor qualidade de impressão
                    backgroundColor: '#ffffff',
                    useCORS: true,
                    allowTaint: false,
                    logging: false,
                }).then(canvas => {
                    const imgData = canvas.toDataURL('image/png');
                    
                    // Cria um iframe oculto para impressão
                    const iframe = document.createElement('iframe');
                    iframe.style.position = 'fixed';
                    iframe.style.right = '0';
                    iframe.style.bottom = '0';
                    iframe.style.width = '0';
                    iframe.style.height = '0';
                    iframe.style.border = '0';
                    document.body.appendChild(iframe);
                    
                    const contentWindow = iframe.contentWindow;
                    if (contentWindow) {
                        contentWindow.document.open();
                        contentWindow.document.write('<html><head><title>Imprimir Certificado</title>');
                        // CSS para garantir que a imagem ocupe a página corretamente em paisagem
                        contentWindow.document.write('<style>@page { size: landscape; margin: 0; } body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; } img { max-width: 100%; height: auto; }</style>');
                        contentWindow.document.write('</head><body>');
                        contentWindow.document.write(`<img src="${imgData}" />`);
                        contentWindow.document.write('</body></html>');
                        contentWindow.document.close();
                        
                        // Aguarda o carregamento da imagem no iframe antes de imprimir
                        const img = contentWindow.document.querySelector('img');
                        const printImage = () => {
                            contentWindow.focus();
                            contentWindow.print();
                            // Remove o iframe após um tempo para garantir que a impressão foi iniciada
                            setTimeout(() => {
                                document.body.removeChild(iframe);
                            }, 2000);
                        };

                        if (img) {
                            if (img.complete) {
                                printImage();
                            } else {
                                img.onload = printImage;
                            }
                        } else {
                             printImage();
                        }
                    }
                    setIsGenerating(false);
                }).catch(err => {
                    console.error("Falha ao gerar o canvas para impressão:", err);
                    alert("Ocorreu um erro ao preparar a impressão. Tente novamente.");
                    setIsGenerating(false);
                });
            }, 100);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[95vh]">
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Pré-visualização do Certificado</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>

                <div className="p-8 bg-gray-100 flex-grow overflow-auto flex items-center justify-center">
                    <div ref={certificateRef} className="shadow-lg">
                        {removal.modality === 'coletivo' ? (
                            <CollectiveCertificate removal={removal} imageUrl={targetUrl} />
                        ) : (
                            <IndividualCertificate removal={removal} imageUrl={targetUrl} />
                        )}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>
                    
                    <button 
                        onClick={handlePrint} 
                        disabled={isGenerating}
                        className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader className="animate-spin h-4 w-4" /> : <Printer size={16} />}
                        Imprimir
                    </button>

                    <button 
                        onClick={handleDownload} 
                        disabled={isGenerating}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGenerating ? <Loader className="animate-spin h-4 w-4" /> : <Download size={16} />}
                        {isGenerating ? 'Gerando...' : 'Baixar Certificado'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CertificateModal;
