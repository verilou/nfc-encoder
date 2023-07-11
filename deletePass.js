const { NFC } = require('nfc-pcsc');
const ndef = require('@taptrack/ndef');
const keypress = require('keypress');
const nfc = new NFC();

nfc.on('reader', (reader) => {
  console.log(`${reader.reader.name}  device attached`);

  reader.on('card', async () => {
    console.log(`${reader.reader.name}  card detected`);
    const data = await reader.read(0, 48); // starts reading in block 4, continues to 5 and 6 in order to read 12 bytes
    console.log(`data read`, data);
    const payload = data.toString(); // utf8 is default encoding
    console.log(`data converted`, payload);
    removeAuth(reader)
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

const removeAuth = async (reader) => {
  try {
    await reader.transmit(
      Buffer.from([
        0xff, // Class
        0x00, // Direct Transmit (see ACR122U)
        0x00, // ...
        0x00, // ...
        0x07, // Length of Direct Transmit payload
        0xd4, // Data Exchange Command (see PN533 docs)
        0x42, // inserted
        0x1b,
        0x70,
        0x61,
        0x73,
        0x73,
      ]),
      45,
    );
    await reader.write(41, Buffer.from([0, 0, 0, 0xFF]))
    await reader.write(42, Buffer.from([0, 0, 0, 0]))
   
    string = '';
    console.log('Written');
  } catch (error) {
    console.log('WTF', error);
    process.exit();
  }
};
