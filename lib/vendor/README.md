SheetJS Community Edition 0.20.3

Source: https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs
Encoding tables: https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/cpexcel.full.mjs

Vendored for the Excel import flow. The local CFB IIFE variable `exports` is renamed to `cfbExports` to avoid the build pipeline falsely transforming the ESM module as CommonJS and emitting duplicate exports. No parsing behavior is changed. The application reads cached cell values and never executes workbook macros.
