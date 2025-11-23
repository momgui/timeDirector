import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { signIn, configureGoogleSignIn, getCurrentUser } from '../services/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type LoginScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [loading, setLoading] = React.useState(false);

    useEffect(() => {
        configureGoogleSignIn();
        checkUser();
    }, []);

    const checkUser = async () => {
        const user = await getCurrentUser();
        if (user) {
            navigation.replace('Dashboard');
        }
    };

    const handleSignIn = async () => {
        setLoading(true);
        const user = await signIn();
        setLoading(false);
        if (user) {
            navigation.replace('Dashboard');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>TimeDirector</Text>
            <Text style={styles.subtitle}>Achieve your goals with AI-powered planning</Text>

            {loading ? (
                <ActivityIndicator size="large" color="#0000ff" />
            ) : (
                <GoogleSigninButton
                    style={{ width: 192, height: 48, marginTop: 20 }}
                    size={GoogleSigninButton.Size.Wide}
                    color={GoogleSigninButton.Color.Dark}
                    onPress={handleSignIn}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 40,
        textAlign: 'center',
    },
});

export default LoginScreen;
