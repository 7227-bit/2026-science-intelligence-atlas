import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const dataPath = path.join(repositoryRoot, 'data.js');
const appPath = path.join(repositoryRoot, 'app.js');

const REQUIRED_FIELDS = [
  'id',
  'title',
  'eventDate',
  'displayDate',
  'category',
  'signalStatus',
  'impactScore',
  'impactRationale',
  'commercialHorizon',
  'commercialHorizonAssumptions',
  'summary',
  'whyItMatters',
  'bottlenecks',
  'opportunityLayers',
  'relatedTechnologies',
  'ecosystemPlayers',
  'unlockSequence',
  'milestones',
  'strategicTakeaway',
  'sources',
  'evidenceClassification',
  'lastReviewed',
  'revisionHistory'
];

const CONTROLLED_CATEGORIES = new Set([
  'Space',
  'Quantum',
  'Energy',
  'Biotechnology',
  'Materials',
  'AI and Robotics',
  'Climate',
  'Advanced Manufacturing'
]);

const CONTROLLED_SIGNAL_STATUSES = new Set([
  'Confirmed',
  'Demonstrated',
  'Preliminary',
  'Projected',
  'Disputed'
]);

const EVIDENCE_CLASSIFICATIONS = new Set([
  'Evidence',
  'Inference',
  'Forecast',
  'Scenario'
]);

const LEGACY_ALIASES = {
  eventDate: 'date',
  displayDate: 'date',
  signalStatus: 'legacySignalLabel',
  impactScore: 'score',
  commercialHorizon: 'horizon',
  summary: 'what',
  whyItMatters: 'why',
  opportunityLayers: 'opportunities',
  unlockSequence: 'chain',
  milestones: 'watch',
  strategicTakeaway: 'takeaway'
};

const EMPTY_ARRAY_ALLOWED = new Set([
  'commercialHorizonAssumptions',
  'opportunityLayers',
  'relatedTechnologies',
  'ecosystemPlayers'
]);

function isPresent(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function hasRequiredField(record, field) {
  if (!Object.prototype.hasOwnProperty.call(record, field)) return false;
  const value = record[field];
  if (Array.isArray(value) && EMPTY_ARRAY_ALLOWED.has(field)) return true;
  return isPresent(value);
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function loadRecords() {
  const source = fs.readFileSync(dataPath, 'utf8');
  const sandbox = { window: {} };
  vm.runInNewContext(source, sandbox, { filename: dataPath, timeout: 1000 });
  const records = sandbox.window.ATLAS_BRIEFS;

  if (!Array.isArray(records)) {
    throw new Error('data.js must assign an array to window.ATLAS_BRIEFS.');
  }

  return records;
}

function findExternalEnhancements() {
  if (!fs.existsSync(appPath)) return new Map();
  const source = fs.readFileSync(appPath, 'utf8');
  const declaration = source.match(/const\s+enhancements\s*=\s*\{([\s\S]*?)\n\};/);
  const results = new Map();

  if (!declaration) return results;

  const entryPattern = /['"]([^'"]+)['"]\s*:\s*\{([^}]*)\}/g;
  for (const match of declaration[1].matchAll(entryPattern)) {
    results.set(match[1], {
      relatedTechnologies: /\brelated\s*:/.test(match[2]),
      ecosystemPlayers: /\bcompanies\s*:/.test(match[2])
    });
  }

  return results;
}

function addIssue(result, severity, code, message) {
  result[severity].push({ code, message });
}

function validateStringArray(result, record, field) {
  if (!isPresent(record[field])) return;
  if (!Array.isArray(record[field]) || record[field].some(value => !isPresent(value) || typeof value !== 'string')) {
    addIssue(result, 'errors', 'INVALID_STRUCTURE', `${field} must be an array of non-empty strings.`);
  }
}

function validateObjectArray(result, record, field, requiredKeys, emptyArrayKeys = new Set()) {
  if (!isPresent(record[field])) return;
  if (!Array.isArray(record[field]) || record[field].some(value => value === null || typeof value !== 'object' || Array.isArray(value))) {
    addIssue(result, 'errors', 'INVALID_STRUCTURE', `${field} must be an array of objects.`);
    return;
  }

  record[field].forEach((value, index) => {
    const missing = requiredKeys.filter(key => {
      if (!Object.prototype.hasOwnProperty.call(value, key)) return true;
      if (Array.isArray(value[key]) && emptyArrayKeys.has(key)) return false;
      return !isPresent(value[key]);
    });
    if (missing.length) {
      addIssue(result, 'errors', 'INVALID_STRUCTURE', `${field}[${index}] is missing: ${missing.join(', ')}.`);
    }
  });
}

function validateNestedDates(result, record) {
  if (isPresent(record.eventDate) && !isIsoDate(record.eventDate)) {
    addIssue(result, 'errors', 'INVALID_ISO_DATE', `eventDate must use a real YYYY-MM-DD date; received ${JSON.stringify(record.eventDate)}.`);
  }
  if (isPresent(record.lastReviewed) && !isIsoDate(record.lastReviewed)) {
    addIssue(result, 'errors', 'INVALID_ISO_DATE', `lastReviewed must use a real YYYY-MM-DD date; received ${JSON.stringify(record.lastReviewed)}.`);
  }

  if (Array.isArray(record.milestones)) {
    record.milestones.forEach((milestone, index) => {
      if (milestone?.targetDate !== null && milestone?.targetDate !== undefined && !isIsoDate(milestone.targetDate)) {
        addIssue(result, 'errors', 'INVALID_ISO_DATE', `milestones[${index}].targetDate must be null or a real YYYY-MM-DD date.`);
      }
    });
  }

  if (Array.isArray(record.sources)) {
    record.sources.forEach((source, index) => {
      if (source?.publicationDate !== null && source?.publicationDate !== undefined && !isIsoDate(source.publicationDate)) {
        addIssue(result, 'errors', 'INVALID_ISO_DATE', `sources[${index}].publicationDate must be null or a real YYYY-MM-DD date.`);
      }
      if (source?.accessedDate !== undefined && !isIsoDate(source.accessedDate)) {
        addIssue(result, 'errors', 'INVALID_ISO_DATE', `sources[${index}].accessedDate must use a real YYYY-MM-DD date.`);
      }
    });
  }

  if (Array.isArray(record.revisionHistory)) {
    record.revisionHistory.forEach((revision, index) => {
      if (revision?.date !== undefined && !isIsoDate(revision.date)) {
        addIssue(result, 'errors', 'INVALID_ISO_DATE', `revisionHistory[${index}].date must use a real YYYY-MM-DD date.`);
      }
    });
  }
}

function validateRecord(record, index, duplicateIds, externalEnhancements) {
  const id = isPresent(record?.id) ? record.id : `record-${index + 1}`;
  const title = isPresent(record?.title) ? record.title : 'Untitled dossier';
  const result = { id, title, errors: [], warnings: [] };

  if (record === null || typeof record !== 'object' || Array.isArray(record)) {
    addIssue(result, 'errors', 'INVALID_RECORD', 'Dossier must be an object.');
    return result;
  }

  const missing = REQUIRED_FIELDS.filter(field => !hasRequiredField(record, field));
  const generalMissing = missing.filter(field => !['sources', 'evidenceClassification'].includes(field));
  if (generalMissing.length) {
    const annotated = generalMissing.map(field => LEGACY_ALIASES[field] && isPresent(record[LEGACY_ALIASES[field]])
      ? `${field} (legacy ${LEGACY_ALIASES[field]} exists)`
      : field);
    addIssue(result, 'errors', 'REQUIRED_FIELDS', `Missing required canonical fields: ${annotated.join(', ')}.`);
  }

  if (!isPresent(record.sources)) {
    addIssue(result, 'errors', 'MISSING_SOURCES', 'No canonical source records are present.');
  }
  if (!isPresent(record.evidenceClassification)) {
    addIssue(result, 'errors', 'MISSING_EVIDENCE_CLASSIFICATION', 'No evidence classifications are present.');
  }

  if (duplicateIds.has(record.id)) {
    addIssue(result, 'errors', 'DUPLICATE_ID', `ID ${JSON.stringify(record.id)} occurs more than once.`);
  }

  if (isPresent(record.category) && !CONTROLLED_CATEGORIES.has(record.category)) {
    addIssue(result, 'errors', 'UNCONTROLLED_CATEGORY', `${JSON.stringify(record.category)} is not a controlled category.`);
  }

  const signalStatus = isPresent(record.signalStatus)
    ? record.signalStatus
    : isPresent(record.legacySignalLabel)
      ? record.legacySignalLabel
      : record.signal;
  if (isPresent(signalStatus) && !CONTROLLED_SIGNAL_STATUSES.has(signalStatus)) {
    addIssue(result, 'errors', 'UNCONTROLLED_SIGNAL_STATUS', `${JSON.stringify(signalStatus)} is not a controlled signal status.`);
  }

  const impactScore = isPresent(record.impactScore) ? record.impactScore : record.score;
  if (isPresent(impactScore) && (typeof impactScore !== 'number' || !Number.isFinite(impactScore) || impactScore < 0 || impactScore > 10)) {
    addIssue(result, 'errors', 'INVALID_IMPACT_SCORE', `Impact score must be a finite number from 0 through 10; received ${JSON.stringify(impactScore)}.`);
  }

  validateNestedDates(result, record);
  validateStringArray(result, record, 'commercialHorizonAssumptions');
  validateStringArray(result, record, 'whyItMatters');
  validateStringArray(result, record, 'relatedTechnologies');
  validateObjectArray(result, record, 'bottlenecks', ['rank', 'name', 'constraintType', 'rationale']);
  validateObjectArray(result, record, 'opportunityLayers', ['name', 'description', 'classification']);
  validateObjectArray(result, record, 'ecosystemPlayers', ['name', 'role', 'relevance']);
  validateObjectArray(result, record, 'unlockSequence', ['order', 'step', 'dependency', 'completionCriteria']);
  validateObjectArray(result, record, 'milestones', ['milestone', 'validationCriteria']);
  validateObjectArray(result, record, 'sources', ['id', 'title', 'publisher', 'url', 'accessedDate', 'sourceType', 'supports']);
  validateObjectArray(
    result,
    record,
    'evidenceClassification',
    ['section', 'classification', 'statement', 'sourceIds', 'basis'],
    new Set(['sourceIds'])
  );
  validateObjectArray(result, record, 'revisionHistory', ['date', 'summary', 'reviewedBy']);

  if (Array.isArray(record.opportunityLayers)) {
    record.opportunityLayers.forEach((layer, layerIndex) => {
      if (isPresent(layer?.classification) && !EVIDENCE_CLASSIFICATIONS.has(layer.classification)) {
        addIssue(result, 'errors', 'INVALID_EVIDENCE_CLASSIFICATION', `opportunityLayers[${layerIndex}].classification is uncontrolled.`);
      }
    });
  }
  if (Array.isArray(record.evidenceClassification)) {
    record.evidenceClassification.forEach((entry, entryIndex) => {
      if (isPresent(entry?.classification) && !EVIDENCE_CLASSIFICATIONS.has(entry.classification)) {
        addIssue(result, 'errors', 'INVALID_EVIDENCE_CLASSIFICATION', `evidenceClassification[${entryIndex}].classification is uncontrolled.`);
      }
    });
  }

  const external = externalEnhancements.get(record.id);
  if (!isPresent(record.relatedTechnologies) && external?.relatedTechnologies) {
    addIssue(result, 'warnings', 'EXTERNAL_RELATED_TECHNOLOGIES', 'Related technologies are stored in app.js instead of the canonical dossier record.');
  }
  if (!isPresent(record.ecosystemPlayers) && external?.ecosystemPlayers) {
    addIssue(result, 'warnings', 'EXTERNAL_ECOSYSTEM_PLAYERS', 'Ecosystem players are stored in app.js instead of the canonical dossier record.');
  }

  return result;
}

function printResults(results, duplicateIds) {
  for (const result of results) {
    console.log(`\n${result.id} — ${result.title}`);
    for (const issue of result.errors) console.log(`  ERROR [${issue.code}] ${issue.message}`);
    for (const issue of result.warnings) console.log(`  WARN  [${issue.code}] ${issue.message}`);
    if (!result.errors.length && !result.warnings.length) console.log('  PASS');
  }

  const errors = results.reduce((total, result) => total + result.errors.length, 0);
  const warnings = results.reduce((total, result) => total + result.warnings.length, 0);
  const valid = results.filter(result => result.errors.length === 0).length;
  const countCode = (severity, code) => results.reduce(
    (total, result) => total + result[severity].filter(issue => issue.code === code).length,
    0
  );

  console.log('\nValidation summary');
  console.log('------------------');
  console.log(`Dossiers checked: ${results.length}`);
  console.log(`Dossiers valid:   ${valid}`);
  console.log(`Errors:           ${errors}`);
  console.log(`Warnings:         ${warnings}`);
  console.log(`Duplicate IDs:    ${duplicateIds.size}`);
  console.log(`Missing sources:  ${countCode('errors', 'MISSING_SOURCES')}`);
  console.log(`Uncontrolled statuses: ${countCode('errors', 'UNCONTROLLED_SIGNAL_STATUS')}`);
  console.log(`Missing evidence classifications: ${countCode('errors', 'MISSING_EVIDENCE_CLASSIFICATION')}`);
  console.log(`External related-technology records: ${countCode('warnings', 'EXTERNAL_RELATED_TECHNOLOGIES')}`);
  console.log(`External ecosystem-player records:   ${countCode('warnings', 'EXTERNAL_ECOSYSTEM_PLAYERS')}`);
  console.log(`\nResult: ${errors ? 'FAILED' : 'PASSED'}`);

  return errors;
}

try {
  const records = loadRecords();
  const idCounts = new Map();
  for (const record of records) {
    if (isPresent(record?.id)) idCounts.set(record.id, (idCounts.get(record.id) ?? 0) + 1);
  }
  const duplicateIds = new Set([...idCounts].filter(([, count]) => count > 1).map(([id]) => id));
  const externalEnhancements = findExternalEnhancements();
  const results = records.map((record, index) => validateRecord(record, index, duplicateIds, externalEnhancements));
  const errorCount = printResults(results, duplicateIds);
  process.exitCode = errorCount ? 1 : 0;
} catch (error) {
  console.error(`Validation could not run: ${error.message}`);
  process.exitCode = 2;
}
