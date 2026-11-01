const REPORT_FORMATS = { CSV: 'CSV', HTML: 'HTML' };
const ROLES = { ADMIN: 'ADMIN', USER: 'USER' };

// Itens acima deste valor são destacados como prioritários para admins
const PRIORITY_THRESHOLD = 1000;
// Valor máximo de item visível para usuários comuns
const USER_VALUE_LIMIT = 500;

class CsvFormatter {
  header() {
    return 'ID,NOME,VALOR,USUARIO\n';
  }

  row(item, user) {
    return `${item.id},${item.name},${item.value},${user.name}\n`;
  }

  footer(total) {
    return `\nTotal,,\n${total},,\n`;
  }
}

class HtmlFormatter {
  header(user) {
    return (
      '<html><body>\n' +
      '<h1>Relatório</h1>\n' +
      `<h2>Usuário: ${user.name}</h2>\n` +
      '<table>\n' +
      '<tr><th>ID</th><th>Nome</th><th>Valor</th></tr>\n'
    );
  }

  row(item, user, highlighted) {
    const style = highlighted ? ' style="font-weight:bold;"' : '';
    return `<tr${style}><td>${item.id}</td><td>${item.name}</td><td>${item.value}</td></tr>\n`;
  }

  footer(total) {
    return '</table>\n' + `<h3>Total: ${total}</h3>\n` + '</body></html>\n';
  }
}

const FORMATTERS = new Map([
  [REPORT_FORMATS.CSV, new CsvFormatter()],
  [REPORT_FORMATS.HTML, new HtmlFormatter()],
]);

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
    const formatter = FORMATTERS.get(reportType);
    if (!formatter) {
      return '';
    }

    let report = formatter.header(user);
    let total = 0;

    for (const item of items) {
      if (user.role === ROLES.ADMIN) {
        // Admins veem todos os itens
        if (item.value > PRIORITY_THRESHOLD) {
          // Lógica bônus para admins
          item.priority = true;
        }
        report += formatter.row(item, user, item.priority);
        total += item.value;
      } else if (user.role === ROLES.USER && item.value <= USER_VALUE_LIMIT) {
        // Users comuns só veem itens de valor baixo
        report += formatter.row(item, user, false);
        total += item.value;
      }
    }

    report += formatter.footer(total);
    return report.trim();
  }
}
