const fs = require('fs');
const files = ['assets/images/app-logo.png', 'assets/images/icon.png', 'assets/images/adaptive-icon.png'];

files.forEach(f => {
  if (fs.existsSync(f)) {
    const buf = fs.readFileSync(f);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
    console.log(f + ': ' + (isPng ? 'VALID PNG (89 50 4E 47)' : 'INVALID MAGIC: ' + buf.slice(0, 4).toString('hex')));
  } else {
    console.log(f + ': NOT FOUND');
  }
});
