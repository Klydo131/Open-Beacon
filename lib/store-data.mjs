const MAX_STORED_CHARACTERS = 100_000;
const MAX_PEOPLE = 50;
const MAX_ITEMS = 100;
const MAX_NAME_CHARACTERS = 80;
const MAX_BODY_CHARACTERS = 500;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/;

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isSafeId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {value is import('./types').Role}
 */
function isRole(value) {
  return (
    value === 'coordinator' || value === 'guide' || value === 'member'
  );
}

/**
 * @param {unknown} value
 * @param {number} maximum
 * @returns {value is string}
 */
function isSafeText(value, maximum) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maximum &&
    value === value.trim() &&
    !CONTROL_CHARACTERS.test(value)
  );
}

/**
 * @param {unknown} value
 * @param {number} lastStage
 * @returns {import('./types').Person | null}
 */
function cleanPerson(value, lastStage) {
  if (!isObject(value)) return null;

  const { id, name, role, guide_id: guideId, stage_index: stageIndex } = value;
  if (!isSafeId(id) || !isSafeText(name, MAX_NAME_CHARACTERS)) return null;
  if (!isRole(role)) return null;
  if (
    typeof stageIndex !== 'number' ||
    !Number.isInteger(stageIndex) ||
    stageIndex < 0 ||
    stageIndex > lastStage
  ) {
    return null;
  }
  if (guideId !== undefined && !isSafeId(guideId)) return null;

  return guideId === undefined
    ? { id, name, role, stage_index: stageIndex }
    : { id, name, role, guide_id: guideId, stage_index: stageIndex };
}

/**
 * @param {unknown} value
 * @returns {string[] | null}
 */
function cleanIdList(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_ITEMS) return null;

  /** @type {string[]} */
  const ids = [];
  for (const id of value) {
    if (!isSafeId(id) || ids.includes(id)) return null;
    ids.push(id);
  }
  return ids;
}

/**
 * @param {unknown} value
 * @returns {import('./types').Note | null}
 */
function cleanNote(value) {
  if (!isObject(value)) return null;
  const { id, author_id: authorId, subject_id: subjectId, body } = value;
  if (
    !isSafeId(id) ||
    !isSafeId(authorId) ||
    !isSafeId(subjectId) ||
    !isSafeText(body, MAX_BODY_CHARACTERS)
  ) {
    return null;
  }
  return { id, author_id: authorId, subject_id: subjectId, body };
}

/**
 * @param {unknown} value
 * @returns {import('./types').Message | null}
 */
function cleanMessage(value) {
  if (!isObject(value)) return null;
  const { id, author_id: authorId, participant_id: participantId, body } = value;
  if (
    !isSafeId(id) ||
    !isSafeId(authorId) ||
    !isSafeId(participantId) ||
    !isSafeText(body, MAX_BODY_CHARACTERS)
  ) {
    return null;
  }
  return { id, author_id: authorId, participant_id: participantId, body };
}

/**
 * @param {unknown} value
 * @returns {import('./types').SupportRequest | null}
 */
function cleanSupportRequest(value) {
  if (!isObject(value)) return null;
  const {
    id,
    person_id: personId,
    body,
    share_anonymously: shareAnonymously,
  } = value;
  if (
    !isSafeId(id) ||
    !isSafeId(personId) ||
    !isSafeText(body, MAX_BODY_CHARACTERS) ||
    typeof shareAnonymously !== 'boolean'
  ) {
    return null;
  }
  return {
    id,
    person_id: personId,
    body,
    share_anonymously: shareAnonymously,
  };
}

/**
 * @param {unknown} value
 * @returns {import('./types').Preferences | null}
 */
function cleanPreferences(value) {
  if (value === undefined) {
    return {
      text_size: 'normal',
      motion: 'full',
      workspace_theme: 'desk',
    };
  }
  if (!isObject(value)) return null;

  const {
    text_size: textSize,
    motion,
    workspace_theme: workspaceTheme,
  } = value;
  if (
    !isTextSize(textSize) ||
    !isMotionPreference(motion) ||
    !isWorkspaceTheme(workspaceTheme)
  ) {
    return null;
  }
  return {
    text_size: textSize,
    motion,
    workspace_theme: workspaceTheme,
  };
}

/**
 * @param {unknown} value
 * @returns {value is import('./types').TextSize}
 */
function isTextSize(value) {
  return value === 'small' || value === 'normal' || value === 'large';
}

/**
 * @param {unknown} value
 * @returns {value is import('./types').MotionPreference}
 */
function isMotionPreference(value) {
  return value === 'full' || value === 'reduced';
}

/**
 * @param {unknown} value
 * @returns {value is import('./types').WorkspaceTheme}
 */
function isWorkspaceTheme(value) {
  return (
    value === 'desk' ||
    value === 'slate' ||
    value === 'warm' ||
    value === 'focus'
  );
}

/**
 * Parses untrusted browser storage into a bounded, normalized store.
 * Missing optional feature collections are migrated to safe empty defaults.
 *
 * @param {string} raw
 * @param {number} lastStage
 * @returns {import('./types').Store | null}
 */
export function parseStoredStore(raw, lastStage) {
  if (
    typeof raw !== 'string' ||
    raw.length === 0 ||
    raw.length > MAX_STORED_CHARACTERS ||
    !Number.isInteger(lastStage) ||
    lastStage < 0
  ) {
    return null;
  }

  try {
    const value = JSON.parse(raw);
    if (
      !isObject(value) ||
      !Array.isArray(value.people) ||
      value.people.length > MAX_PEOPLE
    ) {
      return null;
    }

    /** @type {import('./types').Person[]} */
    const people = [];
    for (const storedPerson of value.people) {
      const person = cleanPerson(storedPerson, lastStage);
      if (!person) return null;
      people.push(person);
    }

    const personIds = new Set(people.map((person) => person.id));
    if (personIds.size !== people.length) return null;

    const guideIds = new Set(
      people
        .filter((person) => person.role === 'guide')
        .map((person) => person.id),
    );
    if (
      people.some(
        (person) =>
          person.role === 'member' &&
          person.guide_id !== undefined &&
          !guideIds.has(person.guide_id),
      )
    ) {
      return null;
    }

    const completedTaskIds = cleanIdList(value.completed_task_ids);
    const savedResourceIds = cleanIdList(value.saved_resource_ids);
    const preferences = cleanPreferences(value.preferences);
    if (!completedTaskIds || !savedResourceIds || !preferences) return null;

    /** @type {import('./types').Note[]} */
    const notes = [];
    const storedNotes = value.notes ?? [];
    if (!Array.isArray(storedNotes) || storedNotes.length > MAX_ITEMS) return null;
    for (const storedNote of storedNotes) {
      const note = cleanNote(storedNote);
      if (
        !note ||
        !personIds.has(note.author_id) ||
        !personIds.has(note.subject_id)
      ) {
        return null;
      }
      notes.push(note);
    }

    /** @type {import('./types').Message[]} */
    const messages = [];
    const storedMessages = value.messages ?? [];
    if (!Array.isArray(storedMessages) || storedMessages.length > MAX_ITEMS) {
      return null;
    }
    for (const storedMessage of storedMessages) {
      const message = cleanMessage(storedMessage);
      if (
        !message ||
        !personIds.has(message.author_id) ||
        !personIds.has(message.participant_id)
      ) {
        return null;
      }
      messages.push(message);
    }

    /** @type {import('./types').SupportRequest[]} */
    const supportRequests = [];
    const storedRequests = value.support_requests ?? [];
    if (!Array.isArray(storedRequests) || storedRequests.length > MAX_ITEMS) {
      return null;
    }
    for (const storedRequest of storedRequests) {
      const request = cleanSupportRequest(storedRequest);
      if (!request || !personIds.has(request.person_id)) return null;
      supportRequests.push(request);
    }

    const collections = [notes, messages, supportRequests];
    if (
      collections.some(
        (items) => new Set(items.map((item) => item.id)).size !== items.length,
      )
    ) {
      return null;
    }

    return {
      people,
      completed_task_ids: completedTaskIds,
      saved_resource_ids: savedResourceIds,
      notes,
      messages,
      support_requests: supportRequests,
      preferences,
    };
  } catch {
    return null;
  }
}
