// client/src/screens/LoginScreen.jsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';

WebBrowser.maybeCompleteAuthSession();

const API_URL = 'http://192.168.0.74:3000';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Configuración de Google AuthSession
    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: '<EXPO_CLIENT_ID>',
        iosClientId: '<IOS_CLIENT_ID>',
        androidClientId: '<ANDROID_CLIENT_ID>',
        webClientId: '<WEB_CLIENT_ID>',
    });

    // Cuando Google devuelve respuesta
    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            handleGoogleLogin(authentication.accessToken);
        }
    }, [response]);

    // Login con email/password
    const handleLogin = async () => {
        setIsLoading(true);
        try {
            const res = await axios.post(
                `${API_URL}/login`,
                { email, password },
                { headers: { 'Content-Type': 'application/json' } }
            );
            const { token, user } = res.data;
            await AsyncStorage.setItem('authToken', token);
            navigation.replace('RoutesScreen', { user });
        } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Error en la conexión');
        } finally {
            setIsLoading(false);
        }
    };

    // Login con token de Google
    const handleGoogleLogin = async (accessToken) => {
        try {
            const res = await axios.post(
                `${API_URL}/google-login`,
                { token: accessToken },
                { headers: { 'Content-Type': 'application/json' } }
            );
            if (res.data.isRegistered) {
                await AsyncStorage.setItem('authToken', res.data.token);
                navigation.replace('Home');
            } else {
                Alert.alert('Info', 'Usuario no registrado con Google');
            }
        } catch {
            Alert.alert('Error', 'No se pudo iniciar sesión con Google');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    {/* Header con logo/icono */}
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Ionicons name="bicycle" size={60} color="#22c55e" />
                        </View>
                        <Text style={styles.appName}>CicloNova</Text>
                        <Text style={styles.subtitle}>Descubre nuevas rutas en bicicleta</Text>
                    </View>

                    {/* Formulario */}
                    <View style={styles.formContainer}>
                        <Text style={styles.welcomeText}>¡Bienvenido de vuelta!</Text>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="mail-outline"
                                size={20}
                                color="#6b7280"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Correo electrónico"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoComplete="email"
                            />
                        </View>

                        {/* Contraseña */}
                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={20}
                                color="#6b7280"
                                style={styles.inputIcon}
                            />
                            <TextInput
                                style={[styles.input, styles.passwordInput]}
                                placeholder="Contraseña"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                            />
                            <TouchableOpacity
                                style={styles.eyeIcon}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                                    size={20}
                                    color="#6b7280"
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Olvidé mi contraseña */}
                        <TouchableOpacity style={styles.forgotPassword}>
                            <Text style={styles.forgotPasswordText}>
                                ¿Olvidaste tu contraseña?
                            </Text>
                        </TouchableOpacity>

                        {/* Botón de Login */}
                        <TouchableOpacity 
                            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                            onPress={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
                            )}
                        </TouchableOpacity>

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.divider} />
                            <Text style={styles.dividerText}>o</Text>
                            <View style={styles.divider} />
                        </View>

                        {/* Botón de Google */}
                        <TouchableOpacity
                            style={styles.googleButton}
                            onPress={() => promptAsync()}
                            disabled={!request}
                        >
                            <Ionicons name="logo-google" size={20} color="#4285f4" />
                            <Text style={styles.googleButtonText}>Continuar con Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>¿No tienes cuenta? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('RegisterScreen')}>
                            <Text style={styles.registerLink}>Regístrate aquí</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// (Aquí va tu objeto styles tal cual lo tenías; no lo repito para no saturar)


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    appName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
    },
    formContainer: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1f2937',
        textAlign: 'center',
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: '#f9fafb',
    },
    inputIcon: {
        marginLeft: 16,
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 56,
        fontSize: 16,
        color: '#1f2937',
    },
    passwordInput: {
        paddingRight: 50,
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        padding: 4,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '500',
    },
    loginButton: {
        backgroundColor: '#22c55e',
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#22c55e',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    loginButtonDisabled: {
        backgroundColor: '#9ca3af',
        shadowOpacity: 0,
        elevation: 0,
    },
    loginButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#6b7280',
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#ffffff',
    },
    googleButtonText: {
        marginLeft: 12,
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 32,
    },
    footerText: {
        color: '#6b7280',
        fontSize: 14,
    },
    registerLink: {
        color: '#22c55e',
        fontSize: 14,
        fontWeight: '600',
    },
});