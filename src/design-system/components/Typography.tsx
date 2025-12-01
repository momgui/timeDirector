import React from 'react';
import { Text, TextProps, StyleSheet, TextStyle, StyleProp } from 'react-native';
import { COLORS, FONTS } from '../tokens';

interface TypographyProps extends TextProps {
    variant?: 'hero' | 'h1' | 'h2' | 'h3' | 'body' | 'caption';
    color?: string;
    weight?: keyof typeof FONTS.weights;
    align?: TextStyle['textAlign'];
    style?: StyleProp<TextStyle>;
}

export const Typography: React.FC<TypographyProps> = ({
    children,
    variant = 'body',
    color = COLORS.textPrimary,
    weight,
    align = 'left',
    style,
    ...props
}) => {
    const getVariantStyle = () => {
        switch (variant) {
            case 'hero':
                return styles.hero;
            case 'h1':
                return styles.h1;
            case 'h2':
                return styles.h2;
            case 'h3':
                return styles.h3;
            case 'caption':
                return styles.caption;
            default:
                return styles.body;
        }
    };

    const baseStyle: TextStyle = {
        color,
        textAlign: align,
        fontWeight: weight ? (FONTS.weights[weight] as TextStyle['fontWeight']) : undefined,
        ...getVariantStyle(),
    };

    // Override fontWeight if variant has specific needs but allow prop override
    if (!weight) {
        if (variant === 'hero' || variant === 'h1' || variant === 'h2') {
            baseStyle.fontWeight = FONTS.weights.medium as any;
        }
    }

    return (
        <Text style={[baseStyle, style]} {...props}>
            {children}
        </Text>
    );
};

const styles = StyleSheet.create({
    hero: {
        fontSize: FONTS.sizes.hero,
        lineHeight: FONTS.lineHeights.hero,
        letterSpacing: FONTS.letterSpacing.tight,
    },
    h1: {
        fontSize: FONTS.sizes.h1,
        lineHeight: FONTS.lineHeights.h1,
        letterSpacing: FONTS.letterSpacing.tight,
    },
    h2: {
        fontSize: FONTS.sizes.h2,
        lineHeight: FONTS.lineHeights.h2,
        letterSpacing: FONTS.letterSpacing.tight,
    },
    h3: {
        fontSize: FONTS.sizes.h3,
        lineHeight: FONTS.lineHeights.h3,
        letterSpacing: FONTS.letterSpacing.normal,
    },
    body: {
        fontSize: FONTS.sizes.body,
        lineHeight: FONTS.lineHeights.body,
        letterSpacing: FONTS.letterSpacing.normal,
    },
    caption: {
        fontSize: FONTS.sizes.caption,
        lineHeight: FONTS.lineHeights.caption,
        letterSpacing: FONTS.letterSpacing.wide,
    },
});
