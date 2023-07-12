const Excel = require('exceljs');
const ndef = require('@taptrack/ndef');
const { NFC } = require('nfc-pcsc');

const nfc = new NFC();

const { execSync } = require('node:child_process');
const dirOpen = () => {
  return execSync(
    `theSelectedFile="
        $(osascript -l JavaScript -e '
            a=Application.currentApplication();
            a.includeStandardAdditions=true;
            a.chooseFile({withPrompt:"Please select a file to process:"}).toString()')"
        echo "$theSelectedFile"`,
  );
};

const response = dirOpen();
const excelPath = response.toString().trim();
console.log(excelPath);
nfc.on('reader', async (reader) => {
  console.log(`${reader.reader.name} (NFC reader/writer) device attached`);

  reader.on('card', async () => {
    const workbook = new Excel.Workbook();
    const file = await workbook.xlsx.readFile(excelPath.trim());
    file.eachSheet(async (worksheet) => {
      worksheet.columns = [{ key: 'path' }, { key: 'encoded' }];
      const rowTotal = worksheet.rowCount;
      for (let index = 0; index < rowTotal; index++) {
        const row = worksheet.getRow(index);
        if (row.values.length > 0 && !row.getCell('encoded').value) {
          const path = 'https://ecardnfc.fr/c/' + row.getCell('path').value;
          try {
            await writeCard(path, reader);
          } catch (error) {
            row.commit();
            await file.xlsx.writeFile(excelPath.trim());
            throw new Error('Something went wrong try to launch the script again');
          }
          row.getCell('encoded').value = true;
          row.commit();
          await file.xlsx.writeFile(excelPath.trim());
          return;
        }
      }
    });
  });

  reader.on('card.off', (card) => {
    console.log(`${reader.reader.name}  card removed`);
  });

  reader.on('error', (err) => {
    console.log(`${reader.reader.name}  an error occurred`, err);
  });

  reader.on('end', () => {
    console.log(`${reader.reader.name}  device removed`);
  });
});

nfc.on('error', (err) => {
  console.log('an error occurred', err);
});

const encapsulate = (data, blockSize = 4) => {
  if (data.length > 0xfffe) {
    throw new Error(
      "Maximal NDEF message size exceeded. Si ce message s'affiche c'est qu'une limite à été atteinte, n'hésitez pas à contacté votre développeur",
    );
  }

  const prefix = Buffer.allocUnsafe(data.length > 0xfe ? 4 : 2);
  prefix[0] = 0x03; // NDEF type
  if (data.length > 0xfe) {
    prefix[1] = 0xff;
    prefix.writeInt16BE(data.length, 2);
  } else {
    prefix[1] = data.length;
  }

  const suffix = Buffer.from([0xfe]);

  const totalLength = prefix.length + data.length + suffix.length;
  const excessLength = totalLength % blockSize;
  const rightPadding = excessLength > 0 ? blockSize - excessLength : 0;
  const newLength = totalLength + rightPadding;

  return Buffer.concat([prefix, data, suffix], newLength);
};

const writeCard = async (string, reader) => {
  const textRecord = ndef.Utils.createUriRecord(string.trim());
  console.log(string);
  const message = new ndef.Message([textRecord]);

  const bytes = message.toByteArray();
  const data = encapsulate(Buffer.from(bytes.buffer));

  await reader.write(4, data);
  await reader.write(43, Buffer.from([0x70, 0x61, 0x73, 0x73]));
  await reader.write(44, Buffer.from([0x98, 0x76, 0, 0]));
  await reader.write(41, Buffer.from([0, 0, 0, 0x04]));
  await reader.write(42, Buffer.from([0x00, 0, 0, 0]));
};
