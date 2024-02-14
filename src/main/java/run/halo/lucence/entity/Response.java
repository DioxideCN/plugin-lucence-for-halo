package run.halo.lucence.entity;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.experimental.Accessors;

/**
 * @author Dioxide.CN
 * @date 2024/2/11
 * @since 1.0
 */
@Getter
@Setter
@ToString
@Accessors(chain = true)
public class Response<T> {

    private Integer code;

    private String message;

    private T data;

    /**
     * 请求成功且不带任何返回参数
     * @return 返回一个封装的请求成功的结果
     */
    public static <T> Response<T> success() {
        return new Response<T>()
            .setCode(Code.SUCCESS.code)
            .setMessage("SUCCESS");
    }

    /**
     * 请求成功且带返回参数data
     * @param data 返回给前端的参数
     * @return 返回一个封装的请求成功的结果
     */
    public static <T> Response<T> success(String message, T data) {
        return new Response<T>()
            .setCode(Code.SUCCESS.code)
            .setMessage(message)
            .setData(data);
    }

    /**
     * 请求失败且带一个失败的消息
     * @param message 请求失败的消息
     * @return 返回一个封装的请求失败的结果
     */
    public static <T> Response<T> fail(String message) {
        return new Response<T>()
            .setCode(Code.FAIL.code)
            .setMessage(message);
    }

    /**
     * 返回一个不带返回参数的自定义请求结果
     * @param code 请求的code
     * @param message 请求返回的消息
     * @return 返回一个封装的请求结果
     */
    public static <T> Response<T> info(Code code, String message) {
        return new Response<T>()
            .setCode(code.code)
            .setMessage(message);
    }

    /**
     * 返回一个自定义请求结果
     * @param code 请求的code
     * @param message 请求返回的消息
     * @return 返回一个封装的请求结果
     */
    public static <T> Response<T> custom(Code code, String message, T data) {
        return new Response<T>()
            .setCode(code.code)
            .setMessage(message)
            .setData(data);
    }

    public enum Code {
        SUCCESS(200),
        FAIL(400),
        UNAUTHORIZED(401),
        NOT_FOUND(404),
        SERVER_ERROR(500);

        final int code;

        Code(int code) {
            this.code = code;
        }
    }

}
