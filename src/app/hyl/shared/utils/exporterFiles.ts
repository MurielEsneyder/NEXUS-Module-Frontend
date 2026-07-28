
import { Injectable } from '@angular/core';
// @ts-ignore
import * as FileSaver from 'file-saver';
// @ts-ignore
import * as XLSX from 'xlsx';

const EXCEL_TYPE =
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; charset=UTF-8';
const EXCEL_EXT = '.xlsx';
	
	
@Injectable({
  providedIn: 'root'
})
export class ExporterFiles{

  constructor() { }

  tamanioArchivo!: number;

  exportToExcel(json: any[], excelFileName: string): void{
    this.tamanioArchivo = json.length;

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(json);
	  const workbook: XLSX.WorkBook = {
	    Sheets: {'data': worksheet},
      SheetNames: ['data']
    };
	  const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
	  this.saveAsExcel(excelBuffer, excelFileName);
  }
 
  public saveAsExcel(buffer: any, fileName: string): void{
     const data: Blob = new Blob([buffer], {type: EXCEL_TYPE});
	  FileSaver.saveAs(data, fileName + '_' + new Date().getDate() +'-'+(new Date().getMonth()+1) + '-'+new Date().getFullYear()+EXCEL_EXT);
    
  }
  
  
}
