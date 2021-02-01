import { NgxMonacoEditorConfig } from 'ngx-monaco-editor';

const dtos = [
  'Activity'
  , 'ActivitySubType'
  , 'Address'
  , 'Approval'
  , 'Attachment'
  , 'BusinessPartner'
  , 'BusinessPartnerGroup'
  , 'BusinessProcessStepDefinition'
  , 'ChecklistCategory'
  , 'ChecklistInstance'
  , 'ChecklistInstanceElement'
  , 'ChecklistTag'
  , 'ChecklistTemplate'
  , 'CompanyInfo'
  , 'CompanySettings'
  , 'Contact'
  , 'CrowdExecutionRecord'
  , 'CrowdPerson'
  , 'Currency'
  , 'CustomRule'
  , 'EmployeeBranch'
  , 'EmployeeDepartment'
  , 'EmployeePosition'
  , 'Enumeration'
  , 'Equipment'
  , 'Expense'
  , 'ExpenseType'
  , 'Filter'
  , 'Function'
  , 'Group'
  , 'Icon'
  , 'Item'
  , 'ItemGroup'
  , 'ItemPriceListAssignment'
  , 'Material'
  , 'Mileage'
  , 'MileageType'
  , 'Notification'
  , 'PaymentTerm'
  , 'Person'
  , 'PersonReservation'
  , 'PersonReservationType'
  , 'PersonWorkTimePattern'
  , 'Plugin'
  , 'PriceList'
  , 'ProfileObject'
  , 'Project'
  , 'ProjectPhase'
  , 'ReportTemplate'
  , 'Requirement'
  , 'ReservedMaterial'
  , 'ScreenConfiguration'
  , 'ServiceAssignment'
  , 'ServiceAssignmentStatus'
  , 'ServiceAssignmentStatusDefinition'
  , 'ServiceCall'
  , 'ServiceCallCode'
  , 'ServiceCallOrigin'
  , 'ServiceCallProblemType'
  , 'ServiceCallResponsible'
  , 'ServiceCallStatus'
  , 'ServiceCallSubject'
  , 'ServiceCallType'
  , 'Skill'
  , 'Tag'
  , 'Tax'
  , 'Team'
  , 'TeamTimeFrame'
  , 'TimeEffort'
  , 'TimeSubTask'
  , 'TimeTask'
  , 'Translation'
  , 'UdfMeta'
  , 'UdfMetaGroup'
  , 'UnifiedPerson'
  , 'UserSyncConfirmation'
  , 'Warehouse'
  , 'WorkTime'
  , 'WorkTimePattern'
  , 'WorkTimeTask'];

export function onMonacoLoad() {

  const monaco = (window as any).monaco;

  monaco.languages.registerCompletionItemProvider('pgsql', {
    provideCompletionItems: function (model, position) {

      const textUntilPosition: string = model.getValueInRange({
        startLineNumber: 1,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });

      const word: { word: string, startColumn: number, endColumn: number } = model.getWordUntilPosition(position);

      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      // textUntilPosition
      // word
      // range

      const key = ['SELECT', 'FROM', 'LIMIT'];
      const ops = ['AND', 'BETWEEN', 'IN', 'LIKE', 'NOT', 'OR', 'IS', 'NULL', 'INTERSECT', 'UNION', 'INNER', 'JOIN', 'LEFT', 'OUTER', 'RIGHT'];

      return {
        suggestions: [

          word.word.toLowerCase() === 's' ? {
            label: 'SELECT',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'SELECT ',
            range: range,
            documentation: '',
          } : undefined,

          ...(textUntilPosition.includes('FROM')
            ? dtos.map(name => ({
              label: `${name}`,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: `${name} `,
              range: range,
              documentation: 'FSM DTO',
            }))
            : [])
        ].filter(x => !!x)
      };

    }
  });

}

export const ngxMonacoEditorConfig = {
  onMonacoLoad,
  baseUrl: 'assets',
  defaultOptions: { scrollBeyondLastLine: false }
} as NgxMonacoEditorConfig;
