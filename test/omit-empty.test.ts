import { describe, expect, it } from 'vitest';
import { omitEmpty } from '../src/omit-empty';

describe('omitEmpty', () => {
  it('drops empty strings, whitespace, empty arrays, and empty objects', () => {
    expect(omitEmpty({
      text: 'Brief the design team',
      assignedTo: [],
      description: '',
      startDate: '   ',
      dueDate: '2026-09-28',
      dueDateTime: '',
      tags: [''],
      meetingId: '',
      fields: [],
    })).toEqual({
      text: 'Brief the design team',
      dueDate: '2026-09-28',
    });
  });

  it('keeps filled nested field values and drops blank field objects', () => {
    expect(omitEmpty({
      text: 'Ship',
      fields: [
        { id: 'field-1', value: 'High' },
        { id: '', value: '' },
      ],
    })).toEqual({
      text: 'Ship',
      fields: [{ id: 'field-1', value: 'High' }],
    });
  });

  it('keeps an empty field value when the field id is set', () => {
    expect(omitEmpty({
      fields: [{ id: 'field-1', value: '' }],
      customFields: [{ fieldId: 'field-1', value: '' }],
    })).toEqual({
      fields: [{ id: 'field-1', value: '' }],
      customFields: [{ fieldId: 'field-1', value: '' }],
    });
  });

  it('drops a field entry whose id is blank', () => {
    expect(omitEmpty({
      fields: [{ id: '', value: 'High' }],
      customFields: [{ fieldId: '   ', value: 'High' }],
    })).toEqual({});
  });

  it('leaves 0 and false in place', () => {
    expect(omitEmpty({ limit: 0, includeSubTasks: false })).toEqual({
      limit: 0,
      includeSubTasks: false,
    });
  });
});
