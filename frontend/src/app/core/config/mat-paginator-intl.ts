import { MatPaginatorIntl } from '@angular/material/paginator';

export function buildPaginatorIntl(): MatPaginatorIntl {
  const paginatorIntl = new MatPaginatorIntl();

  paginatorIntl.itemsPerPageLabel = 'Filas por pagina';
  paginatorIntl.nextPageLabel = 'Pagina siguiente';
  paginatorIntl.previousPageLabel = 'Pagina anterior';
  paginatorIntl.firstPageLabel = 'Primera pagina';
  paginatorIntl.lastPageLabel = 'Ultima pagina';
  paginatorIntl.getRangeLabel = (
    page: number,
    pageSize: number,
    length: number,
  ) => {
    if (length === 0 || pageSize === 0) {
      return '0 de 0';
    }

    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, length);

    return `${startIndex + 1}-${endIndex} de ${length}`;
  };

  return paginatorIntl;
}
