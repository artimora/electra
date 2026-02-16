import { defineConfig } from "bunup";
import { copy } from "bunup/plugins";

export default defineConfig({
	minify: false,
	footer: "// built with love and caffeine by copper :3",
	unused: {
		level: "error",
	},
	plugins: [copy(["../../../README.md", "../../../License.txt"]).to("../")],
});
