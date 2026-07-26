import { useRef, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReceiptView from './ReceiptView';
import type { ReceiptDTO } from '../../app/modules/payment/core/_models';

interface ReceiptContainerProps {
  data: ReceiptDTO;
  /** Optional: show back / contribute again links */
  showLinks?: boolean;
  onBack?: () => void;
  linkToMyContributions?: string;
  linkToContribute?: string;
}

export default function ReceiptContainer({
  data,
  showLinks = true,
  onBack,
  linkToMyContributions = '/my-contributions',
  linkToContribute = '/contribute',
}: ReceiptContainerProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    const el = receiptRef.current;
    if (!el) return;
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const maxW = pageW - 2 * margin;
      const maxH = pageH - 2 * margin;
      let imgW = maxW;
      let imgH = (canvas.height * imgW) / canvas.width;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = (canvas.width * imgH) / canvas.height;
      }
      pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH);
      pdf.save(`receipt-${data.orderId}.pdf`);
    } catch (e) {
      console.error('PDF generation failed', e);
    }
  }, [data.orderId]);

  return (
    <div className="receipt-wrapper">
      <ReceiptView ref={receiptRef} data={data} />
      <div className="receipt-actions no-print">
        <button type="button" className="btn btn-print" onClick={handlePrint}>
          Print / Save as PDF
        </button>
        <button type="button" className="btn btn-download" onClick={handleDownloadPDF}>
          Download PDF
        </button>
      </div>
      {showLinks && (
        <div className="receipt-links no-print" style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9375rem' }}>
          {onBack && (
            <button type="button" onClick={onBack} style={{ marginRight: '1rem', cursor: 'pointer' }}>
              ← Back
            </button>
          )}
          <a href={linkToMyContributions} style={{ marginRight: '1rem', color: '#b8860b', fontWeight: 600 }}>
            My Contributions
          </a>
          <a href={linkToContribute} style={{ color: '#4a5568' }}>
            Contribute again
          </a>
        </div>
      )}
    </div>
  );
}
