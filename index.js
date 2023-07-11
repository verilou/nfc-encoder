const { NFC } = require('nfc-pcsc');
const ndef = require('@taptrack/ndef');
const keypress = require('keypress');
const nfc = new NFC();

nfc.on('reader', (reader) => {
  console.log(`${reader.reader.name} (NFC reader/writer) device attached`);

  reader.on('card', async () => {
    console.log(`${reader.reader.name} (NFC reader/writer) card detected`);
    const data = await reader.read(4, 48); // starts reading in block 4, continues to 5 and 6 in order to read 12 bytes
    const i = data.indexOf(0x00);
    const url = data.slice(6, i - 1).toString();
    let payload = 'the card is empty';
    if (url.length > 0) {
      payload = 'https://' + url; // utf8 is default encoding
    }
    console.log(`card content: `, payload);
    keypress(process.stdin);
    process.stdin.setRawMode(true);

    let inputBuffer = '';
    let hasBeenCallToWrite = false;
    console.log('waiting for scan with format: https://ecardnfc.fr/<insert-code-here>');
    // Handle individual keypress events
    process.stdin.on('keypress', async (ch, key) => {
      if (inputBuffer.length > 8 && !inputBuffer.match('^https?://')) {
        inputBuffer = '';
      } else {
        if (inputBuffer.length > 25 && inputBuffer.includes('https://ecardnfc.fr/')) {
          if (!hasBeenCallToWrite) {
            setTimeout(async () => await writeCard(inputBuffer, reader), 500);
            hasBeenCallToWrite = true;
          }
        }
      }

      // Check if the key is Ctrl+C to exit the application
      if (key && key.ctrl && key.name === 'c') {
        console.log('Exit');
        process.exit();
      }

      // Append the received input to the buffer
      inputBuffer += ch;
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
  try {
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
    console.log('Written');
  } catch (error) {
    console.log('Une erreur est survenue', error);
    process.exit();
  }
};
