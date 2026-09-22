import { describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createPixsoMcpServer } from '../src/server/createMcpServer.js';
import type { PluginSession } from '../src/bridge/pluginSession.js';
import type { ServerConfig } from '../src/types.js';

function stubSession(): PluginSession {
  return {
    getStatus: () => ({ connected: false }),
    call: async () => ({})
  } as unknown as PluginSession;
}

function testConfig(): ServerConfig {
  return {
    transport: 'http',
    host: '127.0.0.1',
    mcpPort: 3668,
    wsPort: 3669,
    wsPath: '/ws',
    pluginTimeoutMs: 30000,
    version: '0.0.0-test'
  };
}

async function listToolNames(): Promise<string[]> {
  const server = createPixsoMcpServer(stubSession(), testConfig());
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'tool-surface-test', version: '0.0.0' }, { capabilities: {} });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const result = await client.listTools();
    return result.tools.map(tool => tool.name);
  } finally {
    await client.close();
    await server.close();
  }
}

describe('MCP tool surface', () => {
  it('exposes the region-first tools alongside the existing scan tools', async () => {
    const names = await listToolNames();
    expect(names).toContain('get_page_outline');
    expect(names).toContain('get_region');
    expect(names).toContain('get_coding_context');
    expect(names).toContain('get_css_context');
    expect(names).toContain('health');
  });

  it('requires a region node id so callers cannot request a whole page by accident', async () => {
    const server = createPixsoMcpServer(stubSession(), testConfig());
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: 'tool-surface-test', version: '0.0.0' }, { capabilities: {} });
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    try {
      const result = await client.listTools();
      const region = result.tools.find(tool => tool.name === 'get_region');
      expect(region).toBeDefined();
      expect(region?.inputSchema).toBeDefined();
      const required = (region?.inputSchema as { required?: string[] }).required ?? [];
      expect(required).toContain('nodeId');
    } finally {
      await client.close();
      await server.close();
    }
  });
});
