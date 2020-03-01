import light from './github-syntax-light.json';
import dark from './github-syntax-dark.json';
import bindings from './gist-syntax-bindings.json';

const themes = {
  light,
  dark,
};

const loadTheme = (theme) => themes[theme];

const getElementThemeColor = (element, theme) => {
  const spanElement = element.tagName === 'SPAN';
  if (spanElement) {
    const { className } = element;
    const type = bindings[className];
    if (theme[type]) return theme[type];
    if (process.env.NODE_ENV === 'development') {
      console.warn('Unresolved syntax class: ', className);
    }
  }
  return theme.text;
};

const splitAndTrim = (text) => {
  const output = [];
  const { length } = text;
  let segment;
  for (let position = 0; position <= length; position += 1) {
    if (!segment && text[position] !== ' ') {
      segment = { start: position };
    }
    if (segment && !segment.end) {
      if (text[position] === ' ' || position === length) {
        segment.end = position;
        segment.text = text.slice(segment.start, segment.end);
        segment.length = segment.text.length;
        output.push(segment);
        segment = undefined;
      }
    }
  }
  return output;
};

class FauxCode {
  constructor(lines, options) {
    this.lines = lines;
    this.lineCount = lines.length;
    this.fontSize = options.fontSize;
    this.leading = options.leading;
    this.lineCap = options.lineCap;
    this.margin = options.margin;
    this.lineNumbers = options.lineNumbers;
    this.lineNumberOffset = options.lineNumberOffset;

    this.theme = loadTheme(options.theme);
    this.width = this.getWidth();
    this.height = this.getHeight();
  }

  getWidth() {
    let longestLine = 0;
    this.lines.forEach((line) => {
      const { length } = line.textContent;
      if (length > longestLine) longestLine = length;
    });

    let width = longestLine * this.fontSize;
    width += this.margin * 2; // add margins
    return width;
  }

  getHeight() {
    let height = this.lineCount * this.leading - this.leading;
    height += this.margin * 2; // add margins
    return height;
  }

  drawRect(x, y, width, height, fillColor) {
    const fill = fillColor || this.theme.background;
    const rect = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" />`;
    return rect;
  }

  createBackground() {
    const rect = this.drawRect(0, 0, this.width, this.height);
    const output = `  ${rect}\n`;
    return output;
  }

  drawLine(x, y, dx, color = false) {
    let output = '';
    if (Math.abs(dx) > 0) {
      const x1 = x * this.fontSize + this.margin;
      const x2 = x1 + dx * this.fontSize;
      const y1 = y * this.leading + this.margin;
      const y2 = y1;

      const offset = x > 0 ? this.fontSize / 2 : (this.fontSize / 2) * -1;
      const strokeAttr = color ? `stroke="${color}" ` : '';

      output += `<line x1="${x1 + offset}" y1="${y1}" x2="${x2 - offset}" y2="${y2}" ${strokeAttr}/>`;
    }
    return output;
  }

  createCodeLine(element, y) {
    if (element.textContent === '\n') return '';

    const children = element.childNodes;
    let output = '    <g class="code line">\n';
    let index = 0;
    children.forEach((child) => {
      const color = getElementThemeColor(child, this.theme);
      const text = child.textContent;

      // Split text string into array of trimmed text segments
      const segments = splitAndTrim(text);
      // Draw each segment line
      segments.forEach((segment) => {
        const { length } = segment;
        if (length) {
          const x = segment.start + index;
          const line = this.drawLine(x, y, length, color);
          output += `      ${line}\n`;
        }
      });

      index += text.length;
    });

    output += '    </g>\n';
    return output;
  }

  createCodeBlock() {
    let output = `  <g class="code block" stroke-linecap="${this.lineCap}" stroke-width="${this.fontSize}">\n`;
    this.lines.forEach((line, lineNumber) => {
      output += this.createCodeLine(line, lineNumber);
    });
    output += '  </g>';
    return output;
  }

  createLineNumbers() {
    const color = this.theme['line-number'];

    let output = `  <g class="line numbers" stroke="${color}" stroke-linecap="${this.lineCap}" stroke-width="${this.fontSize}">\n`;
    for (let y = 0; y < this.lineCount; y += 1) {
      const width = (y + 1).toString().length; // # of digits in line number
      const line = this.drawLine(this.lineNumberOffset, y, -width);
      output += `      ${line}\n`;
    }
    output += '  </g>\n';

    return output;
  }

  render() {
    let svg = `<svg class="faux code" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">\n`;
    svg += this.createBackground();
    svg += this.createCodeBlock();
    if (this.lineNumbers) svg += this.createLineNumbers();
    svg += '</svg>';

    return svg;
  }
}

export default FauxCode;
