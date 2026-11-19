'use client';

import { Card } from '@/components/ui/card';
import { TEMPLATE_HEADERS } from './types';
import type { ImportedRow } from './types';

interface ImportPreviewTableProps {
  previewData: ImportedRow[];
}

export function ImportPreviewTable({ previewData }: ImportPreviewTableProps) {
  return (
    <Card className="border-slate-200 p-5 shadow-none space-y-4 bg-white">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Pré-visualização e Validação dos Dados da Planilha
          </h3>
        </div>
      </div>

      <div className="max-h-[460px] overflow-x-auto overflow-y-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
          <thead className="sticky top-0 bg-slate-100 font-bold uppercase tracking-wider text-center text-slate-600 border-b border-slate-200">
            <tr>
              {TEMPLATE_HEADERS.map((header) => (
                <th key={header} className="p-3">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {previewData.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 text-center">
                {(
                  [
                    'num',
                    'nomeAtleta',
                    'kit',
                    'modalidade',
                    'fxEtaria',
                    'categEspecial',
                    'nascto',
                    'sexo',
                    'equipe',
                    'cidadeUf',
                    'camiseta',
                    'cpfAtleta',
                    'cel',
                    'email',
                    'quemVaiRetirar',
                    'notas',
                    'obs1',
                    'obs2',
                    'alerta',
                    'nomeEvento',
                    'contato',
                    'grauParentesco',
                    'celularContato',
                    'pin',
                    'itensAdicionais',
                  ] as (keyof ImportedRow)[]
                ).map((key) => (
                  <td key={key} className="p-3">
                    {String(row[key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
