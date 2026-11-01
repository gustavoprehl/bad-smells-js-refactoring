const REPORT_FORMATS = { CSV: 'CSV', HTML: 'HTML' };
const ROLES = { ADMIN: 'ADMIN', USER: 'USER' };

// Itens acima deste valor são destacados como prioritários para admins
const PRIORITY_THRESHOLD = 1000;
// Valor máximo de item visível para usuários comuns
const USER_VALUE_LIMIT = 500;

export class ReportGenerator {
  constructor(database) {
    this.db = database;
  }

  /**
   * Gera um relatório de itens baseado no tipo e no usuário.
   * - Admins veem tudo.
   * - Users comuns só veem itens com valor <= 500.
   */
  generateReport(reportType, user, items) {
    let report = '';
    let total = 0;

    // --- Seção do Cabeçalho ---
    if (reportType === REPORT_FORMATS.CSV) {
      report += 'ID,NOME,VALOR,USUARIO\n';
    } else if (reportType === REPORT_FORMATS.HTML) {
      report += '<html><body>\n';
      report += '<h1>Relatório</h1>\n';
      report += `<h2>Usuário: ${user.name}</h2>\n`;
      report += '<table>\n';
      report += '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n';
    }

    // --- Seção do Corpo (Alta Complexidade) ---
    for (const item of items) {
      if (user.role === ROLES.ADMIN) {
        // Admins veem todos os itens
        if (item.value > PRIORITY_THRESHOLD) {
          // Lógica bônus para admins
          item.priority = true;
        }

        if (reportType === REPORT_FORMATS.CSV) {
          report += `${item.id},${item.name},${item.value},${user.name}\n`;
          total += item.value;
        } else if (reportType === REPORT_FORMATS.HTML) {
          const style = item.priority ? 'style="font-weight:bold;"' : '';
          report += `<tr ${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
          total += item.value;
        }
      } else if (user.role === ROLES.USER) {
        // Users comuns só veem itens de valor baixo
        if (item.value <= USER_VALUE_LIMIT) {
          if (reportType === REPORT_FORMATS.CSV) {
            report += `${item.id},${item.name},${item.value},${user.name}\n`;
            total += item.value;
          } else if (reportType === REPORT_FORMATS.HTML) {
            report += `<tr><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
            total += item.value;
          }
        }
      }
    }

    // --- Seção do Rodapé ---
    if (reportType === REPORT_FORMATS.CSV) {
      report += '\nTotal,,\n';
      report += `${total},,\n`;
    } else if (reportType === REPORT_FORMATS.HTML) {
      report += '</table>\n';
      report += `<h3>Total: ${total}</h3>\n`;
      report += '</body></html>\n';
    }

    return report.trim();
  }
}