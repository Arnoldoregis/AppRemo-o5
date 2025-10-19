import React, { useRef } from 'react';
import { Removal } from '../../types';
import { X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';

interface CertificateProps {
    removal: Removal;
    imageUrl: string;
}

const IndividualCertificate: React.FC<CertificateProps> = ({ removal, imageUrl }) => {
    const formattedDate = removal.cremationDate 
        ? format(new Date(removal.cremationDate), 'dd/MM/yyyy') 
        : 'Data não definida';

    return (
        <div
            className="relative w-[800px] h-[565px] text-black"
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
        >
            <img 
                src={imageUrl} 
                alt="Certificado Individual" 
                className="absolute inset-0 w-full h-full"
                crossOrigin="anonymous"
            />
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
    const formattedDate = removal.cremationDate ? format(new Date(removal.cremationDate), 'dd/MM/yyyy') : 'Data não definida';

    return (
        <div
            className="relative w-[800px] h-[565px] text-[#3a506b]"
            style={{ fontFamily: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif" }}
        >
            <img 
                src={imageUrl} 
                alt="Certificado Coletivo" 
                className="absolute inset-0 w-full h-full"
                crossOrigin="anonymous"
            />
            <div className="absolute w-full text-center" style={{ top: '280px', fontSize: '17px', lineHeight: '1.7' }}>
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
}

const CertificateModal: React.FC<CertificateModalProps> = ({ isOpen, onClose, removal }) => {
    const certificateRef = useRef<HTMLDivElement>(null);
    
    const individualUrl = "https://i.ibb.co/yQW2k31/individual.jpg";
    const collectiveUrl = "https://i.ibb.co/5cWz0yD/coletivo-correto.png";

    // Usamos um proxy CORS público para contornar as restrições do navegador.
    const getProxiedUrl = (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

    const imageUrl = removal.modality === 'coletivo' 
        ? getProxiedUrl(collectiveUrl) 
        : getProxiedUrl(individualUrl);

    const handleDownload = () => {
        if (certificateRef.current) {
            html2canvas(certificateRef.current, {
                scale: 3,
                backgroundColor: null,
                useCORS: true, // Habilita o carregamento de imagens de outras origens
            }).then(canvas => {
                const link = document.createElement('a');
                link.download = `certificado_${removal.pet.name.replace(/\s+/g, '_')}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            }).catch(err => {
                console.error("Falha ao gerar o canvas do certificado:", err);
                alert("Ocorreu um erro ao gerar o certificado. Verifique sua conexão ou tente novamente.");
            });
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
                    <div ref={certificateRef}>
                        {removal.modality === 'coletivo' ? (
                            <CollectiveCertificate removal={removal} imageUrl={imageUrl} />
                        ) : (
                            <IndividualCertificate removal={removal} imageUrl={imageUrl} />
                        )}
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end items-center gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Fechar</button>
                    <button onClick={handleDownload} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                        <Download size={16} /> Baixar Certificado
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CertificateModal;
