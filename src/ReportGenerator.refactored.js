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

// Regras de visibilidade e destaque de itens para cada perfil de usuário
const ROLE_POLICIES = new Map([
  [
    ROLES.ADMIN,
    {
      canView: () => true,
      isHighlighted: (item) => item.value > PRIORITY_THRESHOLD,
    },
  ],
  [
    ROLES.USER,
    {
      canView: (item) => item.value <= USER_VALUE_LIMIT,
      isHighlighted: () => false,
    },
  ],
]);

// Perfis desconhecidos não veem nenhum item
const NO_ACCESS_POLICY = {
  canView: () => false,
  isHighlighted: () => false,
};

const sumValues = (items) => items.reduce((total, item) => total + item.value, 0);

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

    const policy = ROLE_POLICIES.get(user.role) ?? NO_ACCESS_POLICY;
    const visibleItems = items.filter((item) => policy.canView(item));

    const report =
      formatter.header(user) +
      this.buildRows(formatter, policy, user, visibleItems) +
      formatter.footer(sumValues(visibleItems));

    return report.trim();
  }

  buildRows(formatter, policy, user, items) {
    return items
      .map((item) => formatter.row(item, user, policy.isHighlighted(item)))
      .join('');
  }
}
