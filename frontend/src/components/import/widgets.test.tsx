import { createRef } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { importedAthlete } from '@/test/fixtures';
import { ImportDropzone } from './import-dropzone';
import { ImportPreviewTable } from './import-preview-table';
describe('spreadsheet widgets', () => {
  it('accepts file selection/drop and displays parsing feedback', () => {
    const props = {
      fileInputRef: createRef<HTMLInputElement>(),
      isDragging: false,
      handleDragOver: vi.fn(),
      handleDragLeave: vi.fn(),
      handleDrop: vi.fn().mockResolvedValue(undefined),
      handleFileUpload: vi.fn().mockResolvedValue(undefined),
      fileName: 'athletes.csv',
      previewDataLength: 1,
      importSuccess: 'Importado',
      importError: null,
    };
    const { container, rerender } = render(<ImportDropzone {...props} />);
    const file = new File(['csv'], 'athletes.csv');
    fireEvent.change(container.querySelector('input')!, {
      target: { files: [file] },
    });
    expect(props.handleFileUpload).toHaveBeenCalledOnce();
    const zone = screen.getByText(/Clique aqui/).parentElement!;
    fireEvent.dragOver(zone);
    fireEvent.dragLeave(zone);
    fireEvent.drop(zone, { dataTransfer: { files: [file] } });
    expect(props.handleDrop).toHaveBeenCalledOnce();
    expect(props.handleDragOver).toHaveBeenCalledOnce();
    expect(props.handleDragLeave).toHaveBeenCalledOnce();
    const click = vi
      .spyOn(props.fileInputRef.current!, 'click')
      .mockImplementation(() => {});
    fireEvent.click(zone);
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByText('1 registros lidos')).toBeInTheDocument();
    rerender(
      <ImportDropzone
        {...props}
        isDragging
        importSuccess={null}
        importError="Planilha inválida"
      />,
    );
    expect(screen.getByText('Planilha inválida')).toBeInTheDocument();
  });
  it('aligns preview headers and values including CPF and team', () => {
    const { rerender } = render(
      <ImportPreviewTable previewData={[importedAthlete]} />,
    );
    expect(screen.getByText(importedAthlete.cpfAtleta)).toBeInTheDocument();
    expect(screen.getByText(importedAthlete.equipe)).toBeInTheDocument();
    expect(screen.getAllByRole('columnheader').length).toBe(
      screen.getAllByRole('cell').length,
    );
    rerender(<ImportPreviewTable previewData={[]} />);
    expect(screen.queryByText('Ana Silva')).not.toBeInTheDocument();
  });
});
