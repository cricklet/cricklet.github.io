declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	/**
	*/
	export class CounterForJs {
	  free(): void;
	/**
	* @returns {CounterForJs}
	*/
	  static new(): CounterForJs;
	/**
	*/
	  think(): void;
	/**
	* @returns {number}
	*/
	  count(): number;
	}
	/**
	*/
	export class PerftForJs {
	  free(): void;
	/**
	* @returns {PerftForJs}
	*/
	  static new(): PerftForJs;
	/**
	* @returns {number}
	*/
	  count(): number;
	/**
	* @param {string} fen
	* @param {number} max_depth
	*/
	  setup(fen: string, max_depth: number): void;
	/**
	* @returns {boolean}
	*/
	  think_and_return_done(): boolean;
	/**
	*/
	  clear(): void;
	}
	/**
	*/
	export class UciForJs {
	  free(): void;
	/**
	* @returns {UciForJs}
	*/
	  static new(): UciForJs;
	/**
	* @param {string} line
	* @returns {string}
	*/
	  handle_line(line: string): string;
	/**
	* @returns {string}
	*/
	  think(): string;
	}
	
}

declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_counterforjs_free: (a: number) => void;
  readonly counterforjs_new: () => number;
  readonly counterforjs_think: (a: number) => void;
  readonly counterforjs_count: (a: number) => number;
  readonly __wbg_uciforjs_free: (a: number) => void;
  readonly uciforjs_new: () => number;
  readonly uciforjs_handle_line: (a: number, b: number, c: number, d: number) => void;
  readonly uciforjs_think: (a: number, b: number) => void;
  readonly __wbg_perftforjs_free: (a: number) => void;
  readonly perftforjs_new: () => number;
  readonly perftforjs_count: (a: number) => number;
  readonly perftforjs_setup: (a: number, b: number, c: number, d: number) => void;
  readonly perftforjs_think_and_return_done: (a: number) => number;
  readonly perftforjs_clear: (a: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
declare function wasm_bindgen (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
