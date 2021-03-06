import React from 'react';
import { Formik, Form } from 'formik';
import { InputField } from '../components/InputField';
import { Box, Button } from '@chakra-ui/react';
import { useCreatePostMutation } from '../generated/graphql';
import { useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { Layout } from '../components/Layout';

const CreatePost: React.FC = ({ }) => {
    const router = useRouter();
    const [, createPost] = useCreatePostMutation();
    return (
        <Layout variant="small">
            <Formik initialValues={{ title: '', text: '' }}
                onSubmit={async (values) => {
                    await createPost({ input: values })
                    router.push("/");
                }}>
                {({ isSubmitting }) => (
                    <Form>
                        <InputField
                            name="title"
                            placeholder="Post Title"
                            label="Title"
                        />
                        <Box mt={4}>
                            <InputField
                                name="text"
                                placeholder="Post text..."
                                label="Body"
                                type="text"
                                textarea={true}
                            />
                        </Box>
                        <Button
                            mt={4}
                            type="submit"
                            colorScheme="teal"
                            variant="outline"
                            isLoading={isSubmitting}>
                            Create Post
                        </Button>
                    </Form>
                )}
            </Formik>
        </Layout>
    );
};

export default withUrqlClient(createUrqlClient)(CreatePost);