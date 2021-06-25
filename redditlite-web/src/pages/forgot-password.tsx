import { Box, Flex, Link, Button } from '@chakra-ui/react';
import { Formik, Form } from 'formik';
import { withUrqlClient } from 'next-urql';
import React, { useState } from 'react'
import { InputField } from '../components/InputField';
import { Wrapper } from '../components/Wrapper';
import { useForgotPasswordMutation } from '../generated/graphql';
import { createUrqlClient } from '../utils/createUrqlClient';

const ForgotPassword: React.FC<{}> = ({ }) => {
    const [complete, setComplete] = useState(false);
    const [, forgotPassword] = useForgotPasswordMutation();
    return (<Wrapper variant="small">
        <Formik initialValues={{ email: "" }}
            onSubmit={async (values) => {
                await forgotPassword(values)
                setComplete(true);
            }}>
            {({ isSubmitting }) => complete ?
                <Box>If an account with the email exists, a password reset will be sent.</Box>
                : (
                    <Form>
                        <InputField
                            name="email"
                            placeholder="Email"
                            label="Email"
                        />
                        <Button
                            mt={4}
                            type="submit"
                            colorScheme="teal"
                            variant="outline"
                            isLoading={isSubmitting}>
                            Forgot password
                        </Button>
                    </Form>
                )}
        </Formik>
    </Wrapper>
    );
}

export default withUrqlClient(createUrqlClient)(ForgotPassword);