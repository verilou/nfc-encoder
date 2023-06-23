const { NFC } = require('nfc-pcsc');
const ndef = require('@taptrack/ndef');

const nfc = new NFC(); 

const encapsulate = (data, blockSize = 4) => {

  if (data.length > 0xfffe) {
    throw new Error('Maximal NDEF message size exceeded.');
  }

  const prefix = Buffer.allocUnsafe(data.length > 0xfe ? 4 : 2);
  prefix[0] = 0x03
  ; // NDEF type
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

nfc.on('reader', (reader) => {
  console.log(`${reader.reader.name}  device attached`);

  reader.on('card', async (card) => {
    console.log(`${reader.reader.name}  card detected`);
    const data = await reader.read(0, 48); // starts reading in block 4, continues to 5 and 6 in order to read 12 bytes
    console.log(`data read`, data);
    const payload = data.toString(); // utf8 is default encoding
    console.log(`data converted`, payload);
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(`Card content`, async (code) => {
      try {
        // Create NDEF Message

        // Create an NDEF message
      const textRecord = ndef.Utils.createUriRecord(code.trim());
      const message = new ndef.Message([textRecord]);
      const bytes = message.toByteArray();
      // convert the Uint8Array into to the Buffer and encapsulate it
      const data = encapsulate(Buffer.from(bytes.buffer));

      // data is instance of Buffer containing encapsulated NDEF message
      await reader.write(4, data);
        readline.close();
        console.log('closed');
      } catch (error) {
        console.log('WTF', error);
        readline.close();
      }
    });
  });

  reader.on('card.off', (card) => {
    console.log(`${reader.reader.name}  card removed`, card);
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

const getMissingAmountForModulo4 = (amount) => {
  const remainder = amount % 4;
  const missingAmount = remainder === 0 ? 0 : 4 - remainder;
  return missingAmount;
};

const getBytes = (string) => {
  return Buffer.byteLength(string, 'utf8');
};
