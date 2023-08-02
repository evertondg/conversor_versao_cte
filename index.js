const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');
const fse = require('fs-extra');

const sourceFolder = 'ctes';
const targetFolder = 'ctes_atualizados';

const currentVersion = '4.00'; // versão que estão os arquivos da pasta cte
const updateVersion = '3.00'; // versão que vai ficar os arquivos da pasta ctes_atualizados

const convertVersion = (xmlData) => {
  if (xmlData.$ && xmlData.$.versao === currentVersion) {
    xmlData.$.versao = updateVersion;
  }
  if (
    xmlData.infCTe &&
    xmlData.infCTe.infModal &&
    xmlData.infCTe.infModal.$ &&
    xmlData.infCTe.infModal.$.versaoModal === currentVersion
  ) {
    xmlData.infCTe.infModal.$.versaoModal = updateVersion;
  }
  return xmlData;
};

const readAndConvertFiles = async () => {
  try {
    // Verifica se a pasta "ctes" existe
    if (!fs.existsSync(sourceFolder)) {
      console.error(`Pasta "${sourceFolder}" não encontrada.`);
      return;
    }

    // Cria a pasta "ctes_atualizados" se não existir
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder);
    } else {
      // Limpa a pasta "ctes_atualizados" antes de salvar os arquivos alterados
      fse.emptyDirSync(targetFolder);
      console.log(`Pasta "${targetFolder}" limpa.`);
    }

    // Lê todos os arquivos na pasta "ctes"
    let convertedCount = 0; // Variável para contar a quantidade de arquivos convertidos
    fs.readdirSync(sourceFolder).forEach(async (file) => {
      const filePath = path.join(sourceFolder, file);
      const xmlData = fs.readFileSync(filePath, 'utf8');

      try {
        // Realiza o parsing do XML para um objeto JavaScript
        const xmlObj = await xml2js.parseStringPromise(xmlData, {
          explicitArray: false,
          attrValueProcessors: [
            (value, name) =>
              (name === 'versao' || name === 'versaoModal') &&
              value === currentVersion
                ? updateVersion
                : value,
          ],
        });

        // Garante que todos os elementos necessários existam antes de fazer a conversão
        const convertedXmlObj = convertVersion(xmlObj);

        // Converte o objeto JavaScript de volta para XML (versão updateVersion)
        const builder = new xml2js.Builder();
        const convertedXmlData = builder.buildObject(convertedXmlObj);

        // Escreve o arquivo convertido na pasta "ctes_atualizados"
        const targetFilePath = path.join(targetFolder, file);
        fs.writeFileSync(targetFilePath, convertedXmlData, 'utf8');
        console.log(
          `Arquivo "${file}" convertido e salvo em "${targetFilePath}"`
        );

        convertedCount++; // Incrementa a contagem de arquivos convertidos
      } catch (err) {
        console.error(`Erro ao converter o arquivo "${file}": ${err.message}`);
      }
    });

    // Exibe a mensagem de conclusão com a quantidade total de arquivos convertidos
    console.log(`\nConversão concluída. Total de ${convertedCount} arquivos convertidos.`);
  } catch (err) {
    console.error('Erro ao ler os arquivos:', err);
  }
};

readAndConvertFiles();
