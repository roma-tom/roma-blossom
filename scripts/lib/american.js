// The audience is American: every word on screen, in the voice and in the caption is American
// English. This flags British words and spellings so they get fixed before a video ships.
//
//   checkText('No surprise at the till')  →  ['"till" → "register"']

const WORDS = [
  ['till', 'register'], ['tills', 'registers'], ['rota', 'schedule'], ['rotas', 'schedules'],
  ['queue', 'line'], ['queues', 'lines'], ['queueing', 'waiting in line'], ['queuing', 'waiting in line'],
  ['takeaway', 'to-go or takeout'], ['take-away', 'to-go or takeout'], ['takeaways', 'takeout orders'],
  ['the bill', 'the check'], ['cheque', 'check'], ['cashpoint', 'ATM'], ['VAT', 'sales tax'],
  ['colour', 'color'], ['colours', 'colors'], ['flavour', 'flavor'], ['flavours', 'flavors'],
  ['favourite', 'favorite'], ['favourites', 'favorites'], ['labour', 'labor'], ['neighbour', 'neighbor'],
  ['neighbourhood', 'neighborhood'], ['honour', 'honor'], ['behaviour', 'behavior'], ['savoury', 'savory'],
  ['centre', 'center'], ['metre', 'meter'], ['litre', 'liter'], ['litres', 'liters'], ['grey', 'gray'],
  ['catalogue', 'catalog'], ['programme', 'program'], ['cosy', 'cozy'], ['maths', 'math'],
  ['whilst', 'while'], ['fortnight', 'two weeks'], ['practise', 'practice'], ['enrol', 'enroll'],
  ['organise', 'organize'], ['organised', 'organized'], ['realise', 'realize'], ['recognise', 'recognize'],
  ['apologise', 'apologize'], ['customise', 'customize'], ['customising', 'customizing'],
  ['prioritise', 'prioritize'], ['minimise', 'minimize'], ['maximise', 'maximize'], ['personalise', 'personalize'],
  ['crisps', 'chips'], ['cutlery', 'silverware'], ['serviette', 'napkin'], ['serviettes', 'napkins'],
  ['starter', 'appetizer'], ['starters', 'appetizers'], ['mains', 'entrées'], ['rubbish', 'trash'],
  ['bin', 'trash can'], ['bins', 'trash cans'], ['toastie', 'grilled cheese or panini'], ['toasties', 'panini'],
  ['aubergine', 'eggplant'], ['courgette', 'zucchini'], ['coriander', 'cilantro'], ['mince', 'ground beef'],
  ['car park', 'parking lot'], ['high street', 'main street'], ['petrol', 'gas'], ['mobile phone', 'cell phone'],
  ['kitchen porter', 'dishwasher'], ['washing up', 'dishes'], ['off licence', 'liquor store'], ['licence', 'license'],
  ['pounds', 'dollars'], ['quid', 'dollars'], ['pence', 'cents'], ['p each', 'cents each'],
];
const PATTERNS = WORDS.map(([uk, us]) => [new RegExp(`\\b${uk.replace(/[-]/g, '[- ]?').replace(/ /g, '\\s+')}\\b`, 'i'), `"${uk}" → "${us}"`]);
PATTERNS.push([/£|€/, 'pounds or euros (use dollars)']);
PATTERNS.push([/\b\d+c\b/, 'cents written as "c" (write "75¢")']);

function checkText(text) {
  const plain = String(text).replace(/\[[^\]]*\]\(\/[^)]*\/\)/g, '').replace(/\*/g, '');
  return PATTERNS.filter(([re]) => re.test(plain)).map(([, why]) => why);
}

// Every string in a storyboard a viewer sees or hears: title, cover, and each scene's say and props.
function checkBoard(board, caption) {
  const found = [];
  const walk = (v, where) => {
    if (typeof v === 'string') checkText(v).forEach((why) => found.push(`${where}: ${why}`));
    else if (Array.isArray(v)) v.forEach((x) => walk(x, where));
    else if (v && typeof v === 'object') Object.values(v).forEach((x) => walk(x, where));
  };
  walk(board.title, 'title');
  walk(board.cover, 'cover');
  (board.scenes || []).forEach((s, i) => {
    walk(s.say, `scene ${i + 1} say`);
    walk(s.props, `scene ${i + 1} on screen`);
  });
  if (caption != null) walk(caption, 'caption.txt');
  return found;
}

module.exports = { checkText, checkBoard };
