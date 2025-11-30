import React, { useRef, useState, useEffect } from 'react';
import { Removal } from '../../types';
import { X, Download, Loader } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

interface CertificateProps {
    removal: Removal;
    imageUrl: string;
}

// Helper para formatar data sem problemas de timezone (UTC vs Local)
const formatCremationDate = (dateString: string | undefined) => {
    if (!dateString) return 'Data não definida';
    // Adiciona T00:00:00 para forçar a interpretação como data local, não UTC
    // Ou faz o split manual para garantir
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

const IndividualCertificate: React.FC<CertificateProps> = ({ removal, imageUrl }) => {
    const formattedDate = formatCremationDate(removal.cremationDate);

    return (
        <div
            className="relative w-[800px] h-[565px] text-black bg-white"
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
    );
};

const CollectiveCertificate: React.FC<CertificateProps> = ({ removal, imageUrl }) => {
    const formattedDate = formatCremationDate(removal.cremationDate);

    return (
        <div
            className="relative w-[800px] h-[565px] text-[#3a506b] bg-white"
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
            <div className="absolute w-full text-center" style={{ top: '230px', fontSize: '17px', lineHeight: '1.7' }}>
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
    const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
    const [isLoadingImage, setIsLoadingImage] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const objectUrlRef = useRef<string | null>(null);
    
    const individualUrl = "https://i.ibb.co/yQW2k31/individual.jpg";
    const collectiveUrl = "https://i.ibb.co/gbkS27xf/Certificado-limpo.jpg";

    const targetUrl = removal.modality === 'coletivo' ? collectiveUrl : individualUrl;

    // Efeito para pré-carregar a imagem como Blob para evitar erros de CORS no html2canvas
    useEffect(() => {
        let isMounted = true;
        
        const loadImage = async () => {
            if (!isOpen) return;
            
            setIsLoadingImage(true);
            setLocalImageUrl(null);

            // Limpa URL anterior se existir
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }

            const fetchImage = async (url: string) => {
                const response = await fetch(url, { mode: 'cors' });
                if (!response.ok) throw new Error(`Failed to load ${url}`);
                return response.blob();
            };

            try {
                let blob;
                
                // Estratégia 1: Tentar fetch direto (i.ibb.co geralmente suporta CORS)
                try {
                    blob = await fetchImage(targetUrl);
                } catch (directError) {
                    console.warn("Fetch direto falhou, tentando proxy...", directError);
                    // Estratégia 2: Usar corsproxy.io se direto falhar
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
                    blob = await fetchImage(proxyUrl);
                }

                if (isMounted && blob) {
                    const objectUrl = URL.createObjectURL(blob);
                    objectUrlRef.current = objectUrl;
                    setLocalImageUrl(objectUrl);
                }
            } catch (error) {
                console.error("Erro fatal ao carregar imagem do certificado:", error);
                // Fallback visual: usa a URL direta (pode não funcionar no download se tiver CORS estrito)
                if (isMounted) setLocalImageUrl(targetUrl);
            } finally {
                if (isMounted) setIsLoadingImage(false);
            }
        };

        loadImage();

        return () => {
            isMounted = false;
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, [isOpen, targetUrl]);

    const handleDownload = () => {
        if (certificateRef.current && localImageUrl) {
            setIsGenerating(true);
            
            // Pequeno delay para garantir que o DOM está pronto
            setTimeout(() => {
                html2canvas(certificateRef.current!, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    useCORS: true, // Importante
                    allowTaint: true, // Permite desenhar imagens de outras origens, mas pode bloquear toDataURL se não for CORS-safe
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
                        alert("Não foi possível baixar a imagem devido a restrições de segurança do navegador (CORS). Tente novamente ou contate o suporte.");
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full flex flex-col max-h-[95vh]">
                <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">Pré-visualização do Certificado</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                </div>

                <div className="p-8 bg-gray-100 flex-grow overflow-auto flex items-center justify-center">
                    {isLoadingImage ? (
                        <div className="flex flex-col items-center text-gray-500">
                            <Loader className="animate-spin h-8 w-8 mb-2 text-blue-600" />
                            <p>Carregando modelo do certificado...</p>
                        </div>
                    ) : (
                        <div ref={certificateRef} className="shadow-lg">
                            {removal.modality === 'coletivo' ? (
                                <CollectiveCertificate removal={removal} imageUrl={localImageUrl || ''} />
                            ) : (
                                <IndividualCertificate removal={removal} imageUrl={localImageUrl || ''} />
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>
                    <button 
                        onClick={handleDownload} 
                        disabled={isLoadingImage || isGenerating || !localImageUrl}
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
