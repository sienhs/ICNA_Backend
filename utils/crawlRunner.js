
// crawlRunner.js
const fs = require('fs');
console.log('✅ 존재 여부:', fs.existsSync('./upcoming_laws/crolling.js'));
console.log("법령 크롤링 통합 스크립트 시작됨");

require('./upcoming_laws/crolling.js');
require('./recent_enforced_laws/crolling1.js');
require('./recent_announced_laws/crolling2.js');
