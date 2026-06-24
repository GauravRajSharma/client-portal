// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname, {
	// [Web-only]: Enables CSS support in Metro.
	isCSSEnabled: true,
});

// Better Auth's core optionally imports @opentelemetry/api via a caught dynamic import.
// We don't ship OpenTelemetry; point it at a stub that throws so Better Auth's .catch()
// falls back to its built-in no-op tracer (an empty module would wrongly "succeed").
const path = require("node:path");
const OTEL_STUB = path.resolve(__dirname, "server/lib/otelStub.js");
config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (moduleName === "@opentelemetry/api" || moduleName.startsWith("@opentelemetry/")) {
		return { type: "sourceFile", filePath: OTEL_STUB };
	}
	return context.resolveRequest(context, moduleName, platform);
};

// add nice web support with optimizing compiler + CSS extraction
const { withTamagui } = require("@tamagui/metro-plugin");
module.exports = withTamagui(config, {
	components: ["tamagui"],
	config: "./tamagui.config.ts",
	outputCSS: "./tamagui-web.css",
});
