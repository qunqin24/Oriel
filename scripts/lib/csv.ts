/**
 * 极简 CSV 解析器，处理 RFC 4180 的引号转义（含逗号、换行、`""` 转义引号）。
 *
 * 猫榜的源数据混用带引号和不带引号的字段（同一行里 `"Pass","Skip",0,"Claude Code",1`
 * 这种写法都出现过），标准库没有内置 CSV 解析，这段量小，没必要为此加一个依赖。
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      pushField();
    } else if (char === "\r") {
      // 忽略；换行统一由 \n 处理，避免 CRLF 产生空行
    } else if (char === "\n") {
      pushRow();
    } else {
      field += char;
    }
  }
  // 文件末尾没有换行符时，最后一个字段/行不会被上面的循环收尾
  if (field.length > 0 || row.length > 0) pushRow();

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export type Table = { headers: string[]; rows: string[][] };

export function parseCsvTable(text: string): Table {
  const [headers, ...rows] = parseCsv(text);
  return { headers: headers ?? [], rows };
}
