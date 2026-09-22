import { describe, expect, it } from 'vitest';
import { z } from 'zod/v4';
import { findRelatedFramesSchema, getCssContextSchema, getExportPreviewSchema, getRegionSchema, getScreenshotSchema, scanDesignSchema } from '../src/tools/schemas.js';

describe('tool schemas', () => {
  it('exposes find_related_frames controls', () => {
    expect(findRelatedFramesSchema.nodeId).toBeDefined();
    expect(findRelatedFramesSchema.maxResults).toBeDefined();
    expect(findRelatedFramesSchema.strategies).toBeDefined();
  });

  it('exposes get_css_context controls', () => {
    const defaults = z.object(getCssContextSchema).parse({});
    expect(defaults.mode).toBe('compact');
    expect(defaults.depth).toBe(3);
    expect(defaults.includeStyleResolution).toBe(true);
    expect(defaults.includeLowConfidence).toBe(false);
    expect(defaults.scope).toBe('key');
    expect(defaults.groupDuplicates).toBe(true);
    expect(defaults.omitDefaults).toBe(true);
    expect(defaults.guidanceProfile).toBe('faithful');
    expect(defaults.declarationMetadata).toBeUndefined();
    expect(defaults.selectorStrategy).toBe('alias');
    expect(getCssContextSchema.selectorStrategy).toBeDefined();
    expect(getCssContextSchema.scope).toBeDefined();
    expect(getCssContextSchema.groupDuplicates).toBeDefined();
    expect(getCssContextSchema.omitDefaults).toBeDefined();
    expect(getCssContextSchema.guidanceProfile).toBeDefined();
  });

  it('exposes export preview and screenshot guards', () => {
    const defaults = z.object(getScreenshotSchema).parse({});
    expect(getExportPreviewSchema.maxPixels).toBeDefined();
    expect(getScreenshotSchema.maxPixels).toBeDefined();
    expect(getScreenshotSchema.allowLargeExport).toBeDefined();
    expect(defaults.contentsOnly).toBe(true);
  });

  it('exposes the two-tool design surface: scan_design (overview) and get_region (detail)', () => {
    const outline = z.object(scanDesignSchema).parse({});
    expect(outline.maxRegions).toBe(16);
    expect(outline.maxDepth).toBe(8);

    const region = z.object(getRegionSchema).parse({ nodeId: '12:3' });
    expect(region.depth).toBe(5);
    expect(region.includeChildren).toBe(true);
    expect(region.includeContract).toBe(true);
    expect(region.foldRepeats).toBe(true);
    expect(region.minRepeat).toBe(3);
  });

  it('requires a region node id so a whole page cannot be requested by accident', () => {
    expect(() => z.object(getRegionSchema).parse({})).toThrow();
  });
});
