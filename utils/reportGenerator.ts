import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CatalogItem, Business } from '../types';
import { formatPrice } from './currency';

export const generateStockReportPDF = (business: Business, items: CatalogItem[], totalStockValue: number) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // 1. Watermark - Using native drawing commands to avoid SVG errors
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({opacity: 0.1})); // Set transparency

    const centerX = pageWidth / 2;
    const centerY = doc.internal.pageSize.getHeight() / 2;
    const iconSize = 50;
    const brandColor = '#16a34a';

    // Draw the cross icon
    doc.setFillColor(brandColor);
    // Horizontal bar of the cross
    doc.rect(centerX - iconSize / 2, centerY - (iconSize / 6) - 20, iconSize, iconSize / 3, 'F');
    // Vertical bar of the cross
    doc.rect(centerX - (iconSize / 6), centerY - iconSize / 2 - 20, iconSize / 3, iconSize, 'F');

    // Draw the text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.setTextColor(brandColor);
    doc.text('PSMZ', centerX, centerY + 30, { align: 'center' });

    doc.restoreGraphicsState();

    // 2. Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40);
    doc.text(`Relatório de Estoque - ${business.name}`, pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(11);
    doc.setTextColor(100);
    const date = new Date().toLocaleString('pt-BR');
    doc.text(`Gerado em: ${date}`, pageWidth / 2, 28, { align: 'center' });


    // 3. Table
    const tableColumn = ["Nome", "Tags", "Estoque", "Preço Unit.", "Valor Total"];
    const tableRows: (string | number)[][] = [];

    items.forEach(item => {
        const itemData = [
            item.name,
            item.tags.join(', '),
            item.quantity,
            formatPrice(item.price, business.country),
            formatPrice(item.price * item.quantity, business.country),
        ];
        tableRows.push(itemData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        headStyles: {
            fillColor: [22, 163, 74] // Green color for header
        },
        styles: {
            halign: 'left'
        },
        columnStyles: {
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        }
    });

    // 4. Footer with Total Value
    const finalY = (doc as any).lastAutoTable.finalY;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40);
    const totalText = `Valor Total do Estoque: ${formatPrice(totalStockValue, business.country)}`;
    doc.text(totalText, 14, finalY + 15);


    // 5. Save the PDF
    doc.save(`relatorio_estoque_${business.name.replace(/\s/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`);
};