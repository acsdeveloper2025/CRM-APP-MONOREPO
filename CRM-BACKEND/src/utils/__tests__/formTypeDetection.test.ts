import { detectResidenceFormType, detectOfficeFormType, detectBusinessFormType, RESIDENCE_OUTCOME_MAPPING } from '../formTypeDetection';

describe('Form Type Detection', () => {
  describe('detectResidenceFormType', () => {
    test('should detect POSITIVE form from outcome', () => {
      const formData = { outcome: 'VERIFIED' };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('POSITIVE');
      expect(result.verificationOutcome).toBe('Positive & Door Locked');
    });

    test('should detect SHIFTED form from outcome', () => {
      const formData = { outcome: 'SHIFTED' };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('SHIFTED');
      expect(result.verificationOutcome).toBe('Shifted & Door Lock');
    });

    test('should detect NSP form from outcome', () => {
      const formData = { outcome: 'NSP' };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('NSP');
      expect(result.verificationOutcome).toBe('NSP & Door Lock');
    });

    test('should detect ENTRY_RESTRICTED form from outcome', () => {
      const formData = { outcome: 'ERT' };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('ENTRY_RESTRICTED');
      expect(result.verificationOutcome).toBe('ERT');
    });

    test('should detect UNTRACEABLE form from outcome', () => {
      const formData = { outcome: 'UNTRACEABLE' };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('UNTRACEABLE');
      expect(result.verificationOutcome).toBe('Untraceable');
    });

    test('should detect UNTRACEABLE form from field indicators', () => {
      const formData = { 
        callRemark: 'Did Not Pick Up Call',
        landmark3: 'Near temple',
        landmark4: 'Behind school'
      };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('UNTRACEABLE');
      expect(result.verificationOutcome).toBe('Untraceable');
    });

    test('should detect SHIFTED form from field indicators', () => {
      const formData = { 
        shiftedPeriod: '6 months ago',
        roomStatus: 'Closed',
        premisesStatus: 'Vacant'
      };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('SHIFTED');
      expect(result.verificationOutcome).toBe('Shifted & Door Lock');
    });

    test('should detect ENTRY_RESTRICTED form from field indicators', () => {
      const formData = { 
        nameOfMetPerson: 'Security Guard',
        metPersonType: 'Security',
        applicantStayingStatus: 'Confirmed'
      };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('ENTRY_RESTRICTED');
      expect(result.verificationOutcome).toBe('ERT');
    });

    test('should detect NSP form from field indicators', () => {
      const formData = { 
        stayingPersonName: 'John Doe',
        houseStatus: 'Closed',
        metPersonStatus: 'Neighbour'
      };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('NSP');
      expect(result.verificationOutcome).toBe('NSP & Door Lock');
    });

    test('should default to POSITIVE form when no indicators found', () => {
      const formData = { 
        someOtherField: 'value'
      };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('POSITIVE');
      expect(result.verificationOutcome).toBe('Positive & Door Locked');
    });

    test('should handle legacy outcome mappings', () => {
      const legacyOutcomes = [
        { outcome: 'NOT_VERIFIED', expectedType: 'NSP' },
        { outcome: 'NEGATIVE', expectedType: 'NSP' },
        { outcome: 'FRAUD', expectedType: 'NSP' },
        { outcome: 'REFER', expectedType: 'ENTRY_RESTRICTED' },
        { outcome: 'HOLD', expectedType: 'ENTRY_RESTRICTED' },
        { outcome: 'PARTIAL', expectedType: 'ENTRY_RESTRICTED' }
      ];

      legacyOutcomes.forEach(({ outcome, expectedType }) => {
        const formData = { outcome };
        const result = detectResidenceFormType(formData);
        expect(result.formType).toBe(expectedType);
      });
    });

    test('should prioritize outcome over field indicators', () => {
      const formData = { 
        outcome: 'POSITIVE',
        callRemark: 'Did Not Pick Up Call', // This would indicate UNTRACEABLE
        landmark3: 'Near temple'
      };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('POSITIVE');
      expect(result.verificationOutcome).toBe('Positive & Door Locked');
    });

    test('should handle finalStatus as outcome source', () => {
      const formData = { finalStatus: 'SHIFTED' };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('SHIFTED');
      expect(result.verificationOutcome).toBe('Shifted & Door Lock');
    });

    test('should handle verificationOutcome as outcome source', () => {
      const formData = { verificationOutcome: 'NSP & Door Lock' };
      const result = detectResidenceFormType(formData);
      expect(result.formType).toBe('NSP');
      expect(result.verificationOutcome).toBe('NSP & Door Lock');
    });
  });

  describe('detectOfficeFormType', () => {
    test('should detect POSITIVE office form', () => {
      const formData = { outcome: 'VERIFIED' };
      const result = detectOfficeFormType(formData);
      expect(result.formType).toBe('POSITIVE');
      expect(result.verificationOutcome).toBe('Positive & Door Locked');
    });

    test('should default to POSITIVE for office forms', () => {
      const formData = { someField: 'value' };
      const result = detectOfficeFormType(formData);
      expect(result.formType).toBe('POSITIVE');
      expect(result.verificationOutcome).toBe('Positive & Door Locked');
    });
  });

  describe('detectBusinessFormType', () => {
    test('should detect POSITIVE business form', () => {
      const formData = { outcome: 'VERIFIED' };
      const result = detectBusinessFormType(formData);
      expect(result.formType).toBe('POSITIVE');
      expect(result.verificationOutcome).toBe('Positive & Door Locked');
    });

    test('should default to POSITIVE for business forms', () => {
      const formData = { someField: 'value' };
      const result = detectBusinessFormType(formData);
      expect(result.formType).toBe('POSITIVE');
      expect(result.verificationOutcome).toBe('Positive & Door Locked');
    });
  });

  describe('RESIDENCE_OUTCOME_MAPPING', () => {
    test('should contain all expected outcome mappings', () => {
      const expectedOutcomes = [
        'VERIFIED', 'POSITIVE', 'Positive & Door Locked',
        'SHIFTED', 'Shifted & Door Lock', 'Shifted & Door Locked',
        'NSP', 'NSP & Door Lock', 'NSP & NSP Door Locked',
        'ERT', 'ENTRY_RESTRICTED', 'Entry Restricted',
        'UNTRACEABLE', 'Untraceable',
        'NOT_VERIFIED', 'NEGATIVE', 'FRAUD', 'REFER', 'HOLD', 'PARTIAL'
      ];

      expectedOutcomes.forEach(outcome => {
        expect(RESIDENCE_OUTCOME_MAPPING).toHaveProperty(outcome);
        expect(RESIDENCE_OUTCOME_MAPPING[outcome]).toHaveProperty('formType');
        expect(RESIDENCE_OUTCOME_MAPPING[outcome]).toHaveProperty('verificationOutcome');
      });
    });
  });
});
