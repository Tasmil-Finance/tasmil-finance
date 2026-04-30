/**
 * Tests for the unified tool registry (render-tool.tsx).
 * Verifies findRegistryRenderer returns correct entries for all tool names.
 */

import { findRegistryRenderer } from "../render-tool";

describe("findRegistryRenderer", () => {
  // ─── resolve_pool routing by protocol ───────────────────────

  describe("resolve_pool routing", () => {
    it("returns entry for aquarius protocol", () => {
      const result = findRegistryRenderer("resolve_pool", { protocol: "aquarius" });
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared");
    });

    it("returns entry for soroswap protocol", () => {
      const result = findRegistryRenderer("resolve_pool", { protocol: "soroswap" });
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared");
    });

    it("returns entry for blend protocol (default)", () => {
      const result = findRegistryRenderer("resolve_pool", { protocol: "blend" });
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared");
    });

    it("returns blend entry when no protocol specified", () => {
      const result = findRegistryRenderer("resolve_pool", {});
      // Falls through to blend default (resolve_pool entry in BLEND_INFO_CARDS)
      expect(result).not.toBeNull();
    });
  });

  // ─── Blend tools ────────────────────────────────────────────

  describe("Blend tools", () => {
    it("finds blend_get_pool_info (info)", () => {
      const result = findRegistryRenderer("blend_get_pool_info");
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared");
    });

    it("finds blend_get_reserve_info (info)", () => {
      const result = findRegistryRenderer("blend_get_reserve_info");
      expect(result).not.toBeNull();
    });

    it("finds blend_get_user_position (info)", () => {
      const result = findRegistryRenderer("blend_get_user_position");
      expect(result).not.toBeNull();
    });

    it("finds blend_deposit (operation)", () => {
      const result = findRegistryRenderer("blend_deposit");
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared-op");
    });

    it("finds blend_borrow (operation)", () => {
      const result = findRegistryRenderer("blend_borrow");
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared-op");
    });

    it("finds blend_withdraw (operation)", () => {
      const result = findRegistryRenderer("blend_withdraw");
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared-op");
    });
  });

  // ─── Aquarius tools ─────────────────────────────────────────

  describe("Aquarius tools", () => {
    it("finds aquarius_list_pools (info)", () => {
      const result = findRegistryRenderer("aquarius_list_pools");
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared");
    });

    it("finds aquarius_get_pool_info (info)", () => {
      const result = findRegistryRenderer("aquarius_get_pool_info");
      expect(result).not.toBeNull();
    });

    it("finds aquarius_add_liquidity (operation)", () => {
      const result = findRegistryRenderer("aquarius_add_liquidity");
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared-op");
    });

    it("finds aquarius_swap (operation)", () => {
      const result = findRegistryRenderer("aquarius_swap");
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared-op");
    });
  });

  // ─── Soroswap tools ─────────────────────────────────────────

  describe("Soroswap tools", () => {
    it("finds swap_get_pools (info)", () => {
      const result = findRegistryRenderer("swap_get_pools");
      expect(result).not.toBeNull();
    });

    it("finds swap_build_transaction (operation)", () => {
      const result = findRegistryRenderer("swap_build_transaction");
      expect(result).not.toBeNull();
      expect(result!.kind).toBe("shared-op");
    });
  });

  // ─── Unknown tools ──────────────────────────────────────────

  describe("Unknown tools", () => {
    it("returns null for unknown tool", () => {
      const result = findRegistryRenderer("nonexistent_tool");
      expect(result).toBeNull();
    });

    it("returns null for flow tools (handled separately)", () => {
      // flow_clarify, flow_compose_and_execute are NOT in the registry
      // They're handled by FLOW_TOOL_RENDERERS in use-defi-tool-renderers.tsx
      const result = findRegistryRenderer("flow_clarify");
      expect(result).toBeNull();
    });

    it("returns null for execute tool (handled by EXECUTE_DISPATCHER)", () => {
      const result = findRegistryRenderer("execute");
      expect(result).toBeNull();
    });
  });
});
