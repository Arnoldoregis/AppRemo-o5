/**
 * Inicia o download de um arquivo no navegador a partir de uma URL.
 * Funciona para URLs de blob e URLs remotas, preservando o tipo do arquivo.
 * @param url - A URL do arquivo a ser baixado.
 * @param fileName - O nome que o arquivo terá ao ser salvo.
 */
export const downloadFile = async (url: string, fileName: string) => {
  if (!url || !fileName) {
    console.error('URL ou nome do arquivo não fornecido para download.');
    alert('Não foi possível iniciar o download: informações do arquivo ausentes.');
    return;
  }

  try {
    // Busca o conteúdo do arquivo (mesmo que seja um blob URL)
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha na rede - status ${response.status}`);
    }
    const blob = await response.blob();

    // Cria um novo blob URL para garantir a consistência
    const blobUrl = window.URL.createObjectURL(blob);

    // Cria um elemento de link <a> temporário.
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;

    // Adiciona, clica e remove o link.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpa o blob URL criado para liberar memória.
    window.URL.revokeObjectURL(blobUrl);

  } catch (error) {
    console.error('Erro ao baixar o arquivo:', error);
    alert(`Não foi possível baixar o arquivo: ${fileName}`);
  }
};
