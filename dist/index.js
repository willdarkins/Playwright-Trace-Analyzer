#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const jszip_1 = __importDefault(require("jszip"));
async function summary() {
    const tracePath = process.argv[2];
    if (!tracePath) {
        console.error('Usage: pw-trace-analyzer <trace.zip>');
        process.exit(1);
    }
    const buffer = await fs_1.default.promises.readFile(tracePath);
    const zip = await jszip_1.default.loadAsync(buffer);
    const entries = Object.keys(zip.files);
    console.log(`Found ${entries.length} entries in ${tracePath}`);
}
summary().catch(err => {
    console.error('✖ Error:', err);
    process.exit(1);
});
