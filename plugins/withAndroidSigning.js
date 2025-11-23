const { withAppBuildGradle } = require('@expo/config-plugins');

const withAndroidSigning = (config) => {
    return withAppBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = applySigningConfig(config.modResults.contents);
        }
        return config;
    });
};

function applySigningConfig(buildGradle) {
    // 1. Add the Release Signing Config
    // We insert it right after "signingConfigs {"
    if (buildGradle.includes('signingConfigs {') && !buildGradle.includes('MYAPP_UPLOAD_STORE_FILE')) {
        buildGradle = buildGradle.replace('signingConfigs {', `signingConfigs {
        release {
            if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
                storeFile file(MYAPP_UPLOAD_STORE_FILE)
                storePassword MYAPP_UPLOAD_STORE_PASSWORD
                keyAlias MYAPP_UPLOAD_KEY_ALIAS
                keyPassword MYAPP_UPLOAD_KEY_PASSWORD
            }
        }
`);
    }

    // 2. Update Release Build Type to use Release Signing
    // We look for the release block inside buildTypes
    const releaseBlockRegex = /buildTypes\s*\{[\s\S]*?release\s*\{([\s\S]*?)\}/;
    const match = buildGradle.match(releaseBlockRegex);

    if (match) {
        const releaseBody = match[1];
        // Only replace if it's currently using debug signing
        if (releaseBody.includes('signingConfig signingConfigs.debug')) {
            const newReleaseBody = releaseBody.replace('signingConfig signingConfigs.debug', 'signingConfig signingConfigs.release');
            buildGradle = buildGradle.replace(releaseBody, newReleaseBody);
        }
    }

    return buildGradle;
}

module.exports = withAndroidSigning;
