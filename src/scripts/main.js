import FauxCode from './FauxCode';
import gists from './gists.json';

const options = {
  theme: 'light', // 'light' or 'dark' mode
  fontSize: 5, // Line thickness and width
  leading: 10, // Space between lines
  lineCap: 'round', // Line ends 'square' or 'round'
  margin: 50, // Space between canvas edges and code block
  lineNumbers: true, // Whether or not to include line numbers
  lineNumberOffset: -3, // Line number offset from margin
};

const getSettings = () => {
  const url = document.querySelector('#url').value;
  // get desired theme
  const light = document.querySelector('#light');
  const theme = light.checked ? 'light' : 'dark';
  // Get desired line end style
  const rounded = document.querySelector('#rounded');
  const lineCap = rounded.checked ? 'round' : 'square';
  return { url, theme, lineCap };
};

const downloadLink = document.querySelector('.output-download');
const downloadButton = document.querySelector('.output-button');
const makeDownloadable = (svgString) => {
  const href = `data:application/octet-stream;base64,${btoa(svgString)}`;
  downloadLink.href = href;
  downloadButton.href = href;
};

const createSVG = (svgString) => {
  const mimeType = 'image/svg+xml';
  const doc = new DOMParser().parseFromString(svgString, mimeType);
  const svg = doc.documentElement;
  return svg;
};

const addElementTo = (element, parentId) => {
  const parent = document.getElementById(parentId);
  parent.innerHTML = '';
  parent.appendChild(parent.ownerDocument.importNode(element, true));
};

const extractCodeBlock = (body) => {
  const mimeType = 'text/html';
  const doc = new DOMParser().parseFromString(body, mimeType);
  const desktop = doc.querySelectorAll('.blob-code-inner'); // desktop version
  const mobile = doc.querySelectorAll('.line'); // mobile version
  const codeBlock = [...desktop, ...mobile];
  return codeBlock;
};

const start = (url, settings) => {
  fetch(`https://cors-anywhere.herokuapp.com/${url}`)
    .then((response) => response.text())
    .then((body) => extractCodeBlock(body))
    .then((codeBlock) => {
      const fauxCode = (new FauxCode(codeBlock, settings)).render();
      const svg = createSVG(fauxCode);
      addElementTo(svg, 'fauxcode');
      makeDownloadable(fauxCode);
    })
    .catch((error) => {
      console.error('Caught error: ', error);
    });
};

const startButtonHandler = () => {
  const settings = getSettings();
  if (!!settings.url && settings.url.includes('gist.github.com')) {
    const { theme, lineCap, url } = settings;
    options.theme = theme;
    options.lineCap = lineCap;
    start(url, options);

    const outputSection = document.querySelector('section.output');
    outputSection.classList.add('ready');
  }
};

const startButton = document.querySelector('#start');
startButton.addEventListener('click', startButtonHandler);

const randomFromList = (list) => {
  const index = Math.floor(Math.random() * list.length);
  const element = list[index];
  return element;
};

const getNewUrl = () => {
  const nextUrl = randomFromList(gists);
  const url = document.getElementById('url');
  url.value = nextUrl;
};

const renew = document.getElementById('renew');
renew.addEventListener('click', getNewUrl);
